import re
import sqlite3
import time
import uuid
from pathlib import Path

import bcrypt
import jwt
from fastapi import Header, HTTPException
from pydantic import BaseModel, field_validator

from .config import settings

DB_PATH = Path(__file__).parent / "data" / "snapsist.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30  # 30 days
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT,
                plan TEXT NOT NULL DEFAULT 'free',
                created_at INTEGER NOT NULL
            )
            """
        )


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
    plan: str


class UserOut(BaseModel):
    email: str
    plan: str


def _make_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": int(time.time()) + TOKEN_TTL_SECONDS}
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def signup(req: SignupRequest) -> AuthResponse:
    if not settings.jwt_secret:
        raise HTTPException(status_code=503, detail="Auth isn't configured on the server yet.")

    password_hash = bcrypt.hashpw(req.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user_id = str(uuid.uuid4())

    with _connect() as conn:
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (req.email,)).fetchone()
        if existing:
            raise HTTPException(status_code=409, detail="An account with this email already exists.")
        conn.execute(
            "INSERT INTO users (id, email, password_hash, plan, created_at) VALUES (?, ?, ?, 'free', ?)",
            (user_id, req.email, password_hash, int(time.time())),
        )

    return AuthResponse(token=_make_token(user_id), email=req.email, plan="free")


def login(req: LoginRequest) -> AuthResponse:
    if not settings.jwt_secret:
        raise HTTPException(status_code=503, detail="Auth isn't configured on the server yet.")

    with _connect() as conn:
        row = conn.execute(
            "SELECT id, password_hash, plan FROM users WHERE email = ?", (req.email.strip().lower(),)
        ).fetchone()

    if not row or not row["password_hash"] or not bcrypt.checkpw(req.password.encode("utf-8"), row["password_hash"].encode("utf-8")):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    return AuthResponse(token=_make_token(row["id"]), email=req.email.strip().lower(), plan=row["plan"])


def get_current_user(authorization: str = Header(default="")) -> UserOut:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header.")
    token = authorization.removeprefix("Bearer ").strip()

    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired session.")

    with _connect() as conn:
        row = conn.execute("SELECT email, plan FROM users WHERE id = ?", (payload["sub"],)).fetchone()

    if not row:
        raise HTTPException(status_code=401, detail="User no longer exists.")

    return UserOut(email=row["email"], plan=row["plan"])
