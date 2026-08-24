import json
import re
import time
import uuid
from datetime import datetime, timezone

import bcrypt
import jwt
from fastapi import Depends, Header, HTTPException
from pydantic import BaseModel, field_validator

from .config import settings
from .db import get_connection
from .pricing import STARTER_TOKENS

TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30  # 30 days
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class SignupRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def valid_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_RE.match(v):
            raise ValueError("Invalid email address.")
        return v

    @field_validator("password")
    @classmethod
    def valid_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        return v


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    email: str
    token_balance: int


class UserOut(BaseModel):
    email: str
    token_balance: int
    created_at: int | None = None


class AccountSummary(BaseModel):
    email: str
    token_balance: int
    created_at: int
    analyses_this_month: int
    analyses_total: int


class TokenTransactionOut(BaseModel):
    amount: int
    reason: str
    created_at: int


class HistoryEntryOut(BaseModel):
    id: str
    type: str
    title: str
    detail: str | None = None
    saved_to: str | None = None
    created_at: int
    # Which L0-L5 rung resolved this analysis (see backend/app/pricing.py's
    # header) — pulled out of FieldsJson, which already carries it via
    # AnalyzeResponse.resolved_layer (see main.py's _save_history_entry).
    resolved_layer: str | None = None
    tokens_spent: int = 0
    analysis_failed: bool = False


def _make_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": int(time.time()) + TOKEN_TTL_SECONDS}
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def signup(req: SignupRequest) -> AuthResponse:
    if not settings.jwt_secret:
        raise HTTPException(status_code=503, detail="Auth isn't configured on the server yet.")

    password_hash = bcrypt.hashpw(req.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user_id = str(uuid.uuid4())
    now = int(time.time())

    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT UserId FROM dbo.Users WHERE Email = %s", (req.email,))
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="An account with this email already exists.")
        # TokenBalance defaults to STARTER_TOKENS via the column's schema
        # default (see db.py) — the ledger row below just makes that starting
        # grant visible in the account's transaction history.
        cur.execute(
            "INSERT INTO dbo.Users (UserId, Email, PasswordHash, [Plan], CreateDate) VALUES (%s, %s, %s, 'free', %s)",
            (user_id, req.email, password_hash, now),
        )
        cur.execute(
            "INSERT INTO dbo.TokenTransactions (TokenTransactionId, UserId, Amount, Reason, CreateDate) VALUES (%s, %s, %s, %s, %s)",
            (str(uuid.uuid4()), user_id, STARTER_TOKENS, "signup_bonus", now),
        )
        conn.commit()
    finally:
        conn.close()

    return AuthResponse(token=_make_token(user_id), email=req.email, token_balance=STARTER_TOKENS)


def login(req: LoginRequest) -> AuthResponse:
    if not settings.jwt_secret:
        raise HTTPException(status_code=503, detail="Auth isn't configured on the server yet.")

    conn = get_connection()
    try:
        cur = conn.cursor(as_dict=True)
        cur.execute(
            "SELECT UserId, PasswordHash, TokenBalance FROM dbo.Users WHERE Email = %s", (req.email.strip().lower(),)
        )
        row = cur.fetchone()
    finally:
        conn.close()

    if not row or not row["PasswordHash"] or not bcrypt.checkpw(
        req.password.encode("utf-8"), row["PasswordHash"].encode("utf-8")
    ):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    return AuthResponse(token=_make_token(row["UserId"]), email=req.email.strip().lower(), token_balance=row["TokenBalance"])


def _current_user_id(authorization: str = Header(default="")) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header.")
    token = authorization.removeprefix("Bearer ").strip()

    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired session.")

    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT UserId FROM dbo.Users WHERE UserId = %s", (payload["sub"],))
        row = cur.fetchone()
    finally:
        conn.close()

    if not row:
        raise HTTPException(status_code=401, detail="User no longer exists.")

    return row[0]


def _optional_user_id(authorization: str = Header(default="")) -> str | None:
    """Like _current_user_id, but returns None instead of raising when no
    (or an invalid) session is present — /analyze stays guest-accessible,
    but logged-in requests get their usage tracked and saved to history."""
    if not authorization.startswith("Bearer "):
        return None
    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None

    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT UserId FROM dbo.Users WHERE UserId = %s", (payload["sub"],))
        row = cur.fetchone()
    finally:
        conn.close()
    return row[0] if row else None


def get_current_user(authorization: str = Header(default="")) -> UserOut:
    user_id = _current_user_id(authorization)
    conn = get_connection()
    try:
        cur = conn.cursor(as_dict=True)
        cur.execute("SELECT Email, TokenBalance, CreateDate FROM dbo.Users WHERE UserId = %s", (user_id,))
        row = cur.fetchone()
    finally:
        conn.close()
    return UserOut(email=row["Email"], token_balance=row["TokenBalance"], created_at=row["CreateDate"])


def try_spend_tokens(user_id: str, amount: int, reason: str = "analysis") -> bool:
    """Atomically deducts `amount` tokens if (and only if) the balance covers
    it, recording a ledger row on success. Returns whether it succeeded — the
    WHERE clause makes this safe against two concurrent requests racing on
    the same low balance (only one UPDATE can match and decrement it)."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE dbo.Users SET TokenBalance = TokenBalance - %s WHERE UserId = %s AND TokenBalance >= %s",
            (amount, user_id, amount),
        )
        spent = cur.rowcount > 0
        if spent:
            cur.execute(
                "INSERT INTO dbo.TokenTransactions (TokenTransactionId, UserId, Amount, Reason, CreateDate) VALUES (%s, %s, %s, %s, %s)",
                (str(uuid.uuid4()), user_id, -amount, reason, int(time.time())),
            )
        conn.commit()
        return spent
    finally:
        conn.close()


def credit_tokens(user_id: str, amount: int, reason: str) -> None:
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("UPDATE dbo.Users SET TokenBalance = TokenBalance + %s WHERE UserId = %s", (amount, user_id))
        cur.execute(
            "INSERT INTO dbo.TokenTransactions (TokenTransactionId, UserId, Amount, Reason, CreateDate) VALUES (%s, %s, %s, %s, %s)",
            (str(uuid.uuid4()), user_id, amount, reason, int(time.time())),
        )
        conn.commit()
    finally:
        conn.close()


def list_token_history(
    user_id: str = Depends(_current_user_id), limit: int = 50, offset: int = 0
) -> list[TokenTransactionOut]:
    limit = max(1, min(limit, 200))
    conn = get_connection()
    try:
        cur = conn.cursor(as_dict=True)
        cur.execute(
            """
            SELECT Amount, Reason, CreateDate
            FROM dbo.TokenTransactions
            WHERE UserId = %s
            ORDER BY CreateDate DESC
            OFFSET %s ROWS FETCH NEXT %s ROWS ONLY
            """,
            (user_id, offset, limit),
        )
        rows = cur.fetchall()
    finally:
        conn.close()
    return [TokenTransactionOut(amount=r["Amount"], reason=r["Reason"], created_at=r["CreateDate"]) for r in rows]


def get_account_summary(user_id: str = Depends(_current_user_id)) -> AccountSummary:
    now = datetime.now(timezone.utc)
    month_start = int(datetime(now.year, now.month, 1, tzinfo=timezone.utc).timestamp())

    conn = get_connection()
    try:
        cur = conn.cursor(as_dict=True)
        cur.execute("SELECT Email, TokenBalance, CreateDate FROM dbo.Users WHERE UserId = %s", (user_id,))
        user = cur.fetchone()
        cur.execute("SELECT COUNT(*) AS n FROM dbo.HistoryEntries WHERE UserId = %s AND CreateDate >= %s", (user_id, month_start))
        this_month = cur.fetchone()["n"]
        cur.execute("SELECT COUNT(*) AS n FROM dbo.HistoryEntries WHERE UserId = %s", (user_id,))
        total = cur.fetchone()["n"]
    finally:
        conn.close()

    return AccountSummary(
        email=user["Email"],
        token_balance=user["TokenBalance"],
        created_at=user["CreateDate"],
        analyses_this_month=this_month,
        analyses_total=total,
    )


def list_history(
    user_id: str = Depends(_current_user_id), limit: int = 20, offset: int = 0
) -> list[HistoryEntryOut]:
    limit = max(1, min(limit, 100))
    conn = get_connection()
    try:
        cur = conn.cursor(as_dict=True)
        cur.execute(
            """
            SELECT HistoryEntryId, [Type], Title, Detail, SavedTo, FieldsJson, CreateDate
            FROM dbo.HistoryEntries
            WHERE UserId = %s
            ORDER BY CreateDate DESC
            OFFSET %s ROWS FETCH NEXT %s ROWS ONLY
            """,
            (user_id, offset, limit),
        )
        entries = cur.fetchall()
    finally:
        conn.close()

    def _fields(fields_json: str | None) -> dict:
        if not fields_json:
            return {}
        try:
            return json.loads(fields_json)
        except (TypeError, ValueError):
            return {}

    # No image_url here on purpose — photos never leave the device now, so
    # the server only ever has the text fields to show, never the picture.
    result = []
    for e in entries:
        f = _fields(e.get("FieldsJson"))
        result.append(
            HistoryEntryOut(
                id=e["HistoryEntryId"],
                type=e["Type"],
                title=e["Title"],
                detail=e["Detail"],
                saved_to=e["SavedTo"],
                created_at=e["CreateDate"],
                resolved_layer=f.get("resolved_layer"),
                tokens_spent=f.get("tokens_spent", 0),
                analysis_failed=f.get("analysis_failed", False),
            )
        )
    return result


def delete_account(user_id: str = Depends(_current_user_id)) -> None:
    conn = get_connection()
    try:
        cur = conn.cursor()
        # UploadedImages has no FK cascade (see db.py) so it's cleaned up explicitly.
        cur.execute("DELETE FROM dbo.UploadedImages WHERE UserId = %s", (user_id,))
        cur.execute("DELETE FROM dbo.Users WHERE UserId = %s", (user_id,))
        conn.commit()
    finally:
        conn.close()
