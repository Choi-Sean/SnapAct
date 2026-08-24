"""
Token top-ups — web-only checkout, deliberately never in-app.

Apple/Google require their own IAP for digital goods consumed inside the
app; routing purchases through the website instead avoids that entirely
and (per the session decision that led here) is a hard product rule, not
just a cost optimization. The mobile app never shows a "buy" button — see
apps/expo/src/PricingScreen.tsx, which only links out to web/app/dashboard.

Flow: web dashboard calls POST /account/checkout with a package id ->
this creates a Stripe Checkout Session (redirect-hosted, so the frontend
never touches card data or needs Stripe.js) -> user pays on Stripe's page
-> Stripe calls POST /webhooks/stripe on completion -> that's the only
place tokens actually get credited (the success_url redirect back to the
dashboard is NOT trusted for crediting, since a user could hit it without
paying — see auth.py's credit_tokens for the actual ledger write).
"""
import logging

import stripe
from fastapi import HTTPException
from pydantic import BaseModel

from .config import settings
from .pricing import TOKEN_PACKAGES

logger = logging.getLogger(__name__)

stripe.api_key = settings.stripe_secret_key


class CheckoutRequest(BaseModel):
    package_id: str


class CheckoutResponse(BaseModel):
    url: str


def _find_package(package_id: str) -> dict:
    pkg = next((p for p in TOKEN_PACKAGES if p["id"] == package_id), None)
    if not pkg:
        raise HTTPException(status_code=400, detail="Unknown token package.")
    return pkg


def create_checkout_session(user_id: str, package_id: str) -> str:
    if not settings.stripe_enabled:
        raise HTTPException(status_code=503, detail="Payments aren't configured on the server yet.")

    pkg = _find_package(package_id)
    session = stripe.checkout.Session.create(
        mode="payment",
        payment_method_types=["card"],
        line_items=[
            {
                "price_data": {
                    "currency": "usd",
                    "unit_amount": round(pkg["price_usd"] * 100),
                    "product_data": {"name": f"Snapsist — {pkg['tokens']} tokens"},
                },
                "quantity": 1,
            }
        ],
        # Read back in the webhook to know who to credit and how many
        # tokens — never trust the client for either of those.
        metadata={"user_id": user_id, "package_id": pkg["id"], "tokens": str(pkg["tokens"])},
        success_url=f"{settings.web_base_url}/dashboard?checkout=success",
        cancel_url=f"{settings.web_base_url}/dashboard?checkout=cancel",
    )
    return session.url


def handle_webhook(payload: bytes, sig_header: str) -> None:
    if not settings.stripe_webhook_secret:
        # Webhook endpoint registered but the signing secret hasn't been set
        # yet (chicken-and-egg: the secret is only issued once Stripe's
        # dashboard has a URL to point at) — refuse rather than skip
        # verification, since an unverified webhook is a free "credit me
        # tokens" endpoint.
        raise HTTPException(status_code=503, detail="Webhook not configured yet.")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.stripe_webhook_secret)
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Invalid webhook signature.")

    if event["type"] != "checkout.session.completed":
        return

    session = event["data"]["object"]
    metadata = session.get("metadata") or {}
    user_id = metadata.get("user_id")
    tokens = metadata.get("tokens")
    if not user_id or not tokens:
        logger.error("Stripe webhook missing user_id/tokens metadata: %s", session.get("id"))
        return

    from . import auth  # local import avoids a circular import with main.py

    auth.credit_tokens(user_id, int(tokens), "purchase")
