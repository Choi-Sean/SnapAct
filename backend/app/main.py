import base64
import hmac
import logging
import mimetypes
import uuid

from fastapi import Depends, FastAPI, File, Header, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

from . import auth, claude_analysis, db, storage, vision, wallet
from .auth import AuthResponse, LoginRequest, SignupRequest, UserOut
from .config import settings
from .models import AnalyzeResponse
from .ratelimit import daily_spend_cap, get_client_ip, rate_limiter

logger = logging.getLogger(__name__)

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
def auth_signup(req: SignupRequest, request: Request):
    rate_limiter.check(f"signup:{get_client_ip(request)}", settings.auth_rate_limit_per_hour, 3600)
    return auth.signup(req)


@app.post("/auth/login", response_model=AuthResponse)
def auth_login(req: LoginRequest, request: Request):
    rate_limiter.check(f"login:{get_client_ip(request)}", settings.auth_rate_limit_per_hour, 3600)
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
def wallet_demo_pass(request: Request):
    rate_limiter.check(f"wallet:{get_client_ip(request)}", settings.analyze_rate_limit_per_hour, 3600)
    try:
        pkpass_bytes = wallet.build_pkpass()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    return PlainTextResponse(base64.b64encode(pkpass_bytes).decode("ascii"))


def _store_upload(image_bytes: bytes, content_type: str) -> None:
    """Best-effort: every upload lands in R2 regardless of demo/logged-in status
    or how the analysis turns out. Storage failures shouldn't block the response
    the user is waiting on, so this only logs on error."""
    if not settings.r2_enabled:
        return
    try:
        extension = mimetypes.guess_extension(content_type) or ""
        key = f"uploads/{uuid.uuid4()}{extension}"
        storage.upload_image(key, image_bytes, content_type)
    except Exception:
        logger.exception("Failed to store upload in R2")


@app.post("/analyze", response_model=AnalyzeResponse, dependencies=[Depends(require_api_key)])
async def analyze(
    request: Request,
    file: UploadFile = File(...),
    mock_category: str | None = Query(
        default=None,
        description="Demo-mode only: force a category (business_card|receipt|event_flyer|document|other) when no API keys are configured.",
    ),
):
    rate_limiter.check(f"analyze:{get_client_ip(request)}", settings.analyze_rate_limit_per_hour, 3600)

    if not file.content_type:
        raise HTTPException(status_code=400, detail="File must have a content type.")

    image_bytes = await file.read()
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 10MB).")
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty file.")

    _store_upload(image_bytes, file.content_type)

    # Global daily ceiling on real (paid) Vision/Claude usage — catches abuse
    # spread across many IPs that the per-IP rate limit alone wouldn't stop.
    # Once hit, every request for the rest of the UTC day gets the mock
    # pipeline instead of erroring, so the app keeps working in demo mode.
    would_spend = vision.settings.vision_enabled or claude_analysis.settings.claude_enabled
    within_cap = daily_spend_cap.try_consume(settings.daily_real_analyze_cap) if would_spend else True
    if would_spend and not within_cap:
        logger.warning("Daily real-API spend cap reached; serving mock response.")
    force_mock = would_spend and not within_cap

    is_image = file.content_type.startswith("image/")
    if is_image:
        category, confidence, ocr_text = vision.classify_image(image_bytes, mock_category=mock_category, force_mock=force_mock)
    else:
        # Vision's label/text detection only understands raster image bytes —
        # PDFs and other document types skip straight to a generic bucket
        # rather than being rejected outright.
        category, confidence, ocr_text = "document", 0.4, None

    using_real_pipeline = vision.settings.vision_enabled and claude_analysis.settings.claude_enabled and not force_mock

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
    text_only_categories = {"receipt", "document", "medication"}
    ocr_text_for_claude = ocr_text if (using_real_pipeline and category in text_only_categories) else None

    # Claude's image content blocks only accept raster image media types — a PDF
    # (or anything else without OCR text behind it) can't be sent that way.
    if using_real_pipeline and not is_image and not ocr_text_for_claude:
        return AnalyzeResponse(
            mock=False,
            category=category,
            confidence=confidence,
            suggested_action="none",
            summary="This file type isn't analyzed yet — it's saved, but text/field extraction only runs on photos for now.",
        )

    result = claude_analysis.analyze(
        image_bytes, category, confidence, media_type=file.content_type, ocr_text=ocr_text_for_claude, force_mock=force_mock
    )
    return result
