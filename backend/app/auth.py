import re
import time
import uuid

import bcrypt
import jwt
from fastapi import Depends, Header, HTTPException
from pydantic import BaseModel, field_validator

from .config import settings
from .db import get_connection

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

    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM dbo.users WHERE email = %s", (req.email,))
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="An account with this email already exists.")
        cur.execute(
            "INSERT INTO dbo.users (id, email, password_hash, [plan], created_at) VALUES (%s, %s, %s, 'free', %s)",
            (user_id, req.email, password_hash, int(time.time())),
        )
        conn.commit()
    finally:
        conn.close()

    return AuthResponse(token=_make_token(user_id), email=req.email, plan="free")


def login(req: LoginRequest) -> AuthResponse:
    if not settings.jwt_secret:
        raise HTTPException(status_code=503, detail="Auth isn't configured on the server yet.")

    conn = get_connection()
    try:
        cur = conn.cursor(as_dict=True)
        cur.execute(
            "SELECT id, password_hash, [plan] FROM dbo.users WHERE email = %s", (req.email.strip().lower(),)
        )
        row = cur.fetchone()
    finally:
        conn.close()

    if not row or not row["password_hash"] or not bcrypt.checkpw(
        req.password.encode("utf-8"), row["password_hash"].encode("utf-8")
    ):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    return AuthResponse(token=_make_token(row["id"]), email=req.email.strip().lower(), plan=row["plan"])


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
        cur.execute("SELECT id FROM dbo.users WHERE id = %s", (payload["sub"],))
        row = cur.fetchone()
    finally:
        conn.close()

    if not row:
        raise HTTPException(status_code=401, detail="User no longer exists.")

    return row[0]


def get_current_user(authorization: str = Header(default="")) -> UserOut:
    user_id = _current_user_id(authorization)
    conn = get_connection()
    try:
        cur = conn.cursor(as_dict=True)
        cur.execute("SELECT email, [plan] FROM dbo.users WHERE id = %s", (user_id,))
        row = cur.fetchone()
    finally:
        conn.close()
    return UserOut(email=row["email"], plan=row["plan"])


def cancel_plan(user_id: str = Depends(_current_user_id)) -> UserOut:
    conn = get_connection()
    try:
        cur = conn.cursor(as_dict=True)
        cur.execute("UPDATE dbo.users SET [plan] = 'free' WHERE id = %s", (user_id,))
        cur.execute("SELECT email, [plan] FROM dbo.users WHERE id = %s", (user_id,))
        row = cur.fetchone()
        conn.commit()
    finally:
        conn.close()
    return UserOut(email=row["email"], plan=row["plan"])


def delete_account(user_id: str = Depends(_current_user_id)) -> None:
    conn = get_connection()
    try:
        cur = conn.cursor()
        # uploaded_images has no FK cascade (see db.py) so it's cleaned up explicitly.
        cur.execute("DELETE FROM dbo.uploaded_images WHERE user_id = %s", (user_id,))
        cur.execute("DELETE FROM dbo.users WHERE id = %s", (user_id,))
        conn.commit()
    finally:
        conn.close()
