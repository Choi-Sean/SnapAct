import base64
import hmac

from fastapi import Depends, FastAPI, File, Header, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

from . import auth, claude_analysis, db, vision, wallet
from .auth import AuthResponse, LoginRequest, SignupRequest, UserOut
from .config import settings
from .models import AnalyzeResponse

app = FastAPI(title="Snapsist API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB


@app.on_event("startup")
def on_startup():
    db.init_db()


def require_api_key(x_api_key: str = Header(default="")):
    if not settings.api_shared_secret:
        return
    if not hmac.compare_digest(x_api_key, settings.api_shared_secret):
        raise HTTPException(status_code=401, detail="Invalid or missing API key.")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "vision_enabled": vision.settings.vision_enabled,
        "claude_enabled": claude_analysis.settings.claude_enabled,
        "auth_enabled": bool(settings.api_shared_secret),
        "wallet_enabled": settings.wallet_enabled,
        "accounts_enabled": bool(settings.jwt_secret),
        "db_enabled": settings.db_enabled,
        "google_oauth_enabled": settings.google_oauth_enabled,
    }


@app.post("/auth/signup", response_model=AuthResponse)
def auth_signup(req: SignupRequest):
    return auth.signup(req)


@app.post("/auth/login", response_model=AuthResponse)
def auth_login(req: LoginRequest):
    return auth.login(req)


@app.get("/auth/me", response_model=UserOut)
def auth_me(user: UserOut = Depends(auth.get_current_user)):
    return user


@app.post("/account/cancel-plan", response_model=UserOut)
def account_cancel_plan(user: UserOut = Depends(auth.cancel_plan)):
    return user


@app.delete("/account", status_code=204)
def account_delete(_: None = Depends(auth.delete_account)):
    return None


@app.get("/wallet/demo-pass", dependencies=[Depends(require_api_key)])
def wallet_demo_pass():
    try:
        pkpass_bytes = wallet.build_pkpass()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    return PlainTextResponse(base64.b64encode(pkpass_bytes).decode("ascii"))


@app.post("/analyze", response_model=AnalyzeResponse, dependencies=[Depends(require_api_key)])
async def analyze(
    file: UploadFile = File(...),
    mock_category: str | None = Query(
        default=None,
        description="Demo-mode only: force a category (business_card|receipt|event_flyer|document|other) when no API keys are configured.",
    ),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    image_bytes = await file.read()
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image too large (max 10MB).")
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty file.")

    category, confidence, ocr_text = vision.classify_image(image_bytes, mock_category=mock_category)

    using_real_pipeline = vision.settings.vision_enabled and claude_analysis.settings.claude_enabled

    # Nothing recognizable in the photo — skip the Claude call entirely rather than
    # paying for a vision request that will just come back empty.
    if using_real_pipeline and category == "other":
        return AnalyzeResponse(
            mock=False,
            category=category,
            confidence=confidence,
            suggested_action="none",
            summary="No business card, receipt, event, or document content was recognized in this photo.",
        )

    # Text-dense categories: hand Claude the OCR text instead of the image. Text tokens
    # are much cheaper than image tokens, and dates/amounts/addresses read fine from text alone.
    text_only_categories = {"receipt", "document"}
    ocr_text_for_claude = ocr_text if (using_real_pipeline and category in text_only_categories) else None

    result = claude_analysis.analyze(
        image_bytes, category, confidence, media_type=file.content_type, ocr_text=ocr_text_for_claude
    )
    return result
