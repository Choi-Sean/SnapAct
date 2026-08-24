import base64
import hmac
import json
import logging
import time
import uuid

from fastapi import BackgroundTasks, Depends, FastAPI, File, Header, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

from . import auth, claude_analysis, db, medication_extract, payments, sensitive_content, vision, wallet
from .auth import AccountSummary, AuthResponse, HistoryEntryOut, LoginRequest, SignupRequest, TokenTransactionOut, UserOut
from .config import settings
from .models import AnalyzeResponse
from .payments import CheckoutRequest, CheckoutResponse
from .pricing import LAYER0_CATEGORIES, LAYER2_TOKEN_COST, TOKEN_PACKAGES
from .ratelimit import daily_spend_cap, get_client_ip, rate_limiter

logger = logging.getLogger(__name__)

app = FastAPI(title="Snapsist API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    # Matches the production domain plus any Vercel preview/deployment URL
    # (project name isn't fixed, so the exact preview hostnames vary).
    allow_origin_regex=r"https://([a-zA-Z0-9-]+\.)*snapsist\.app|https://[a-zA-Z0-9-]+\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_CONTENT_TYPES_PREFIX = "image/"
ALLOWED_NON_IMAGE_CONTENT_TYPES = {"application/pdf"}


async def _read_limited(file: UploadFile, max_bytes: int) -> bytes:
    """Reads in chunks and aborts as soon as max_bytes is exceeded, so a
    request can't force the server to buffer an arbitrarily large body in
    memory first — the X-API-Key is embedded in the public app bundle, so
    this can't rely on the caller behaving."""
    chunks: list[bytes] = []
    total = 0
    while True:
        chunk = await file.read(256 * 1024)
        if not chunk:
            break
        total += len(chunk)
        if total > max_bytes:
            raise HTTPException(status_code=413, detail="File too large (max 10MB).")
        chunks.append(chunk)
    return b"".join(chunks)


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


def check_account_rate(request: Request) -> None:
    # Defense in depth: these all already require a valid JWT, but a leaked
    # token (or a bug) shouldn't be able to hammer the DB without limit.
    # Declared via the route's `dependencies=` list (not called from inside
    # the function body) specifically so it runs BEFORE the auth dependency
    # below it does its own DB lookup — same pattern as require_api_key.
    rate_limiter.check(f"account:{get_client_ip(request)}", 60, 3600)


_account_rate_limited = [Depends(check_account_rate)]


@app.get("/auth/me", response_model=UserOut, dependencies=_account_rate_limited)
def auth_me(user: UserOut = Depends(auth.get_current_user)):
    return user


@app.get("/account/summary", response_model=AccountSummary, dependencies=_account_rate_limited)
def account_summary(summary: AccountSummary = Depends(auth.get_account_summary)):
    return summary


@app.get("/account/token-history", response_model=list[TokenTransactionOut], dependencies=_account_rate_limited)
def account_token_history(entries: list[TokenTransactionOut] = Depends(auth.list_token_history)):
    return entries


@app.get("/account/token-packages")
def account_token_packages():
    return {"packages": TOKEN_PACKAGES, "layer2_cost_per_analysis": LAYER2_TOKEN_COST}


# ---- Web-only checkout (see payments.py's header — never wired into the
# app, only the web dashboard) ------------------------------------------
@app.post("/account/checkout", response_model=CheckoutResponse, dependencies=_account_rate_limited)
def account_checkout(req: CheckoutRequest, user_id: str = Depends(auth._current_user_id)):
    url = payments.create_checkout_session(user_id, req.package_id)
    return CheckoutResponse(url=url)


@app.post("/webhooks/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    payments.handle_webhook(payload, sig_header)
    return {"received": True}


@app.get("/history", response_model=list[HistoryEntryOut], dependencies=_account_rate_limited)
def history(entries: list[HistoryEntryOut] = Depends(auth.list_history)):
    return entries


@app.delete("/account", status_code=204, dependencies=_account_rate_limited)
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


def _save_history_entry(user_id: str, category: str, result: AnalyzeResponse) -> None:
    """Best-effort: a logged-in user's analysis is saved to their history
    (text fields only — the photo itself is never uploaded, so there's
    nothing to store here beyond what got extracted) so the web dashboard
    has real usage/history to show. Never blocks or fails the /analyze
    response; runs after the response is already sent (BackgroundTasks)."""
    try:
        conn = db.get_connection()
        try:
            cur = conn.cursor()
            entry_id = str(uuid.uuid4())
            now = int(time.time())
            fields_json = json.dumps(result.model_dump(exclude={"mock", "raw_text"}), default=str)
            cur.execute(
                """
                INSERT INTO dbo.HistoryEntries (HistoryEntryId, UserId, [Type], Title, Detail, SavedTo, FieldsJson, CreateDate)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (entry_id, user_id, category, (result.summary or category)[:255], result.summary, result.suggested_action, fields_json, now),
            )
            conn.commit()
        finally:
            conn.close()
    except Exception:
        logger.exception("Failed to save history entry")


@app.post("/analyze", response_model=AnalyzeResponse, dependencies=[Depends(require_api_key)])
async def analyze(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    mock_category: str | None = Query(
        default=None,
        description="Demo-mode only: force a category (business_card|receipt|event_flyer|document|other) when no API keys are configured.",
    ),
    user_id: str | None = Depends(auth._optional_user_id),
):
    rate_limiter.check(f"analyze:{get_client_ip(request)}", settings.analyze_rate_limit_per_hour, 3600)

    if not file.content_type:
        raise HTTPException(status_code=400, detail="File must have a content type.")
    if not (
        file.content_type.startswith(ALLOWED_CONTENT_TYPES_PREFIX)
        or file.content_type in ALLOWED_NON_IMAGE_CONTENT_TYPES
    ):
        raise HTTPException(status_code=400, detail="Unsupported file type.")

    image_bytes = await _read_limited(file, MAX_IMAGE_BYTES)
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty file.")

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

    # Payment-card photos never get analyzed or saved, regardless of what
    # category Vision guessed (a card's "New Card(s) are here!" sticker text
    # reads a lot like a business card to keyword matching) — see
    # sensitive_content.py's header for why this check exists and how it
    # decides. Short-circuits before Claude ever sees the image/text and
    # before anything is written to history.
    if ocr_text and sensitive_content.looks_like_payment_card(ocr_text):
        return AnalyzeResponse(
            mock=False,
            category=category,
            confidence=confidence,
            suggested_action="none",
            summary="This looks like a payment card. We don't store or analyze sensitive card details — nothing was saved.",
            resolved_layer="L2",
        )

    # ---- L3 vs L5c (see backend/app/pricing.py's header for the full L0-L5
    # map) -------------------------------------------------------------
    # medication/document/other resolve deterministically here (L3 —
    # regex/keyword extraction, medication_extract.py) and never cost
    # tokens. business_card/receipt/event_flyer have no L3 rules yet, so
    # they fall straight through to L5c (Claude, claude_analysis.py) — the
    # only L5 tier actually reachable right now (L5a on-device / L5b Apple
    # Private Cloud Compute are iOS/Android-native work, not built here).
    requires_tokens = False
    if category in LAYER0_CATEGORIES:
        mocked = force_mock or not vision.settings.vision_enabled
        if category == "medication":
            medication = medication_extract.extract(ocr_text or "")
            has_usable_fields = bool(medication.name or medication.dosage)
            result = AnalyzeResponse(
                mock=mocked,
                category=category,
                confidence=confidence,
                suggested_action="reminder" if has_usable_fields else "none",
                medication=medication if has_usable_fields else None,
                needs_time_selection=has_usable_fields and not medication.specific_times,
                raw_text=ocr_text,
                summary=medication.name or "Medication label detected.",
                resolved_layer="L3",
            )
        else:
            result = AnalyzeResponse(
                mock=mocked,
                category=category,
                confidence=confidence,
                suggested_action="none",
                raw_text=ocr_text,
                summary=(
                    "No business card, receipt, event, or document content was recognized in this photo."
                    if category == "other"
                    else "Document detected — no structured fields extracted in this version."
                ),
                resolved_layer="L2",
            )
    else:
        using_claude = claude_analysis.settings.claude_enabled and not force_mock
        requires_tokens = using_claude and (not user_id or not auth.try_spend_tokens(user_id, LAYER2_TOKEN_COST))

        if requires_tokens:
            result = AnalyzeResponse(
                mock=False,
                category=category,
                confidence=confidence,
                suggested_action="none",
                requires_tokens=True,
                summary="This category needs an account with tokens to unlock full extraction.",
            )
        else:
            # Text-dense categories: hand Claude the OCR text instead of the image.
            # Text tokens are much cheaper than image tokens, and amounts/dates
            # read fine from text alone; business_card/event_flyer need the
            # actual layout, so those still get the image.
            text_only_categories = {"receipt"}
            ocr_text_for_claude = ocr_text if (using_claude and category in text_only_categories) else None

            # Claude's image content blocks only accept raster image media types — a PDF
            # (or anything else without OCR text behind it) can't be sent that way.
            if using_claude and not is_image and not ocr_text_for_claude:
                result = AnalyzeResponse(
                    mock=False,
                    category=category,
                    confidence=confidence,
                    suggested_action="none",
                    summary="This file type isn't analyzed yet — it's saved, but text/field extraction only runs on photos for now.",
                )
            else:
                result = claude_analysis.analyze(
                    image_bytes, category, confidence, media_type=file.content_type, ocr_text=ocr_text_for_claude, force_mock=force_mock
                )

    # The photo itself is never uploaded — only the extracted text fields are
    # saved, and only for a signed-in user with a real (non-locked) result.
    if user_id and not requires_tokens:
        background_tasks.add_task(_save_history_entry, user_id, category, result)

    return result
