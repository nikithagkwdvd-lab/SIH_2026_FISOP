"""
DEV-ONLY: Token issuance endpoint for local frontend testing.
This router is ONLY registered when ENVIRONMENT=development.
It allows the frontend devLogin() function to obtain a real HS256-signed JWT
without needing Keycloak, so all backend endpoints accept the token correctly.

NEVER deploy this in production. The backend main.py guards registration with ENVIRONMENT check.
"""
import os
from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel

from app.security.jwt_validator import create_test_token

router = APIRouter(prefix="/api/dev", tags=["Dev Auth (Local Only - Never Production)"])


class DevTokenRequest(BaseModel):
    sub: str
    username: str
    roles: List[str]
    email: Optional[str] = None
    preferred_username: Optional[str] = None
    department_code: Optional[str] = None
    expires_in: int = 3600  # 1 hour


class DevTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


@router.post("/token", response_model=DevTokenResponse)
def issue_dev_token(req: DevTokenRequest):
    """
    Issues a real HS256-signed JWT for a dev persona.
    Only active when ENVIRONMENT=development.
    The token is accepted by all backend endpoints exactly like a Keycloak token.
    """
    token = create_test_token(
        sub=req.sub,
        username=req.username,
        roles=req.roles,
        email=req.email,
        preferred_username=req.preferred_username,
        department_code=req.department_code,
        expires_in=req.expires_in,
    )
    return DevTokenResponse(access_token=token, expires_in=req.expires_in)
