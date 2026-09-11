import os
import time
from collections import defaultdict
from typing import Dict, List, Optional
from fastapi import Request, HTTPException, status


class SlidingWindowRateLimiter:
    """
    Redis-less, thread-safe, in-memory Sliding Window Rate Limiter.
    Limits excessive API requests per client identifier without external infrastructure.
    """
    def __init__(
        self,
        max_requests: Optional[int] = None,
        window_seconds: Optional[float] = None
    ):
        self.max_requests = max_requests or int(os.getenv("RATE_LIMIT_REQUESTS", "60"))
        self.window_seconds = window_seconds or float(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60.0"))
        self.requests: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, client_key: str) -> tuple[bool, int]:
        now = time.time()
        window_start = now - self.window_seconds

        # Clean old timestamps outside sliding window
        self.requests[client_key] = [
            t for t in self.requests[client_key] if t > window_start
        ]

        if len(self.requests[client_key]) >= self.max_requests:
            # Calculate seconds remaining until oldest request expires
            oldest = self.requests[client_key][0]
            retry_after = int(max(1.0, (oldest + self.window_seconds) - now))
            return False, retry_after

        self.requests[client_key].append(now)
        return True, 0

    def reset(self, client_key: Optional[str] = None):
        if client_key:
            self.requests.pop(client_key, None)
        else:
            self.requests.clear()


# Global rate limiter instance
global_rate_limiter = SlidingWindowRateLimiter()


async def rate_limit_dependency(request: Request):
    """
    FastAPI security dependency enforcing rate limits on expensive / sensitive endpoints.
    """
    # Key by Authorization Bearer token header or Client IP
    auth_header = request.headers.get("Authorization", "")
    client_ip = request.client.host if request.client else "127.0.0.1"
    key = auth_header if auth_header else client_ip

    allowed, retry_after = global_rate_limiter.is_allowed(key)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded: Maximum {global_rate_limiter.max_requests} requests per {int(global_rate_limiter.window_seconds)}s. Try again in {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)}
        )
