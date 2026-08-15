import base64
import hmac

from fastapi import Depends, FastAPI, File, Header, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

from . import claude_analysis, vision, wallet
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
    }


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

    category, confidence = vision.classify_image(image_bytes, mock_category=mock_category)
    result = claude_analysis.analyze(image_bytes, category, confidence, media_type=file.content_type)
    return result
