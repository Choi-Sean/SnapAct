import time
from collections import defaultdict
from datetime import datetime, timezone
from threading import Lock

from fastapi import HTTPException, Request


def get_client_ip(request: Request) -> str:
    # Railway sits in front of the app as a proxy, so the real client IP
    # arrives via X-Forwarded-For rather than the raw socket address.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


class RateLimiter:
    """Fixed-window per-key rate limiter. In-memory, so it resets on deploy
    and doesn't share state across instances — good enough for a single
    Railway instance; swap for Redis if this ever runs scaled out."""

    def __init__(self) -> None:
        self._hits: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()

    def check(self, key: str, max_requests: int, window_seconds: int) -> None:
        now = time.time()
        cutoff = now - window_seconds
        with self._lock:
            hits = self._hits[key]
            while hits and hits[0] < cutoff:
                hits.pop(0)
            if len(hits) >= max_requests:
                raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
            hits.append(now)


class DailySpendCap:
    """Caps how many requests are allowed to hit real (paid) Vision/Claude
    APIs per UTC day, regardless of which IP they come from — protects
    against distributed abuse that a per-IP limiter alone wouldn't catch.
    Once the cap is hit, callers should serve mock responses instead."""

    def __init__(self) -> None:
        self._date = None
        self._count = 0
        self._lock = Lock()

    def try_consume(self, cap: int) -> bool:
        today = datetime.now(timezone.utc).date()
        with self._lock:
            if self._date != today:
                self._date = today
                self._count = 0
            if self._count >= cap:
                return False
            self._count += 1
            return True


rate_limiter = RateLimiter()
daily_spend_cap = DailySpendCap()
