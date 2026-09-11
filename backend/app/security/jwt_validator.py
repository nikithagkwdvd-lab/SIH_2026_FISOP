import os
import time
import jwt
from jwt import PyJWKClient
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security_scheme = HTTPBearer(auto_error=False)

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev_secret_key_government_interoperability_2026")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
KEYCLOAK_ISSUER = os.getenv("KEYCLOAK_ISSUER", "http://localhost:8080/realms/government-interoperability")
KEYCLOAK_AUDIENCE = os.getenv("KEYCLOAK_AUDIENCE", "interoperability-api")
KEYCLOAK_JWKS_URL = os.getenv("KEYCLOAK_JWKS_URL", f"{KEYCLOAK_ISSUER}/protocol/openid-connect/certs")

# Initialize JWKS client for Keycloak public keys
try:
    _jwks_client = PyJWKClient(KEYCLOAK_JWKS_URL)
except Exception:
    _jwks_client = None


class UserPayload(BaseModel):
    sub: str
    username: str
    email: Optional[str] = None
    roles: List[str] = []
    preferred_username: Optional[str] = None
    canonical_citizen_id: Optional[str] = None
    department_code: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


def create_test_token(
    sub: str,
    username: str,
    roles: List[str],
    email: Optional[str] = None,
    preferred_username: Optional[str] = None,
    department_code: Optional[str] = None,
    expires_in: int = 3600
) -> str:
    """
    Helper function to generate valid JWT tokens for automated security tests.
    """
    now = int(time.time())
    payload = {
        "sub": sub,
        "username": username,
        "email": email or f"{username}@synthetic-gov.example",
        "iss": KEYCLOAK_ISSUER,
        "aud": KEYCLOAK_AUDIENCE,
        "iat": now,
        "exp": now + expires_in,
        "realm_access": {"roles": roles},
        "preferred_username": preferred_username or username,
        "canonical_citizen_id": preferred_username,
        "department_code": department_code
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_scheme)
) -> UserPayload:
    """
    FastAPI security dependency validating Keycloak OIDC JWT tokens.
    Rejects unauthenticated or malformed requests with HTTP 401 Unauthorized.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = credentials.credentials
    try:
        # Check token header to determine whether it's an RS256 Keycloak token or HS256 dev token
        unverified_header = jwt.get_unverified_header(token)
        alg = unverified_header.get("alg", "HS256")

        if alg == "RS256" and _jwks_client:
            signing_key = _jwks_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                options={"verify_signature": True, "verify_exp": True, "verify_aud": False}
            )
        else:
            # Fallback for HS256 dev-signed tokens
            payload = jwt.decode(
                token,
                JWT_SECRET_KEY,
                algorithms=[JWT_ALGORITHM, "HS256"],
                options={"verify_signature": True, "verify_exp": True, "verify_aud": False}
            )

        sub = payload.get("sub")
        if not sub:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload: missing sub claim"
            )

        roles: List[str] = []
        realm_access = payload.get("realm_access")
        if isinstance(realm_access, dict):
            roles = realm_access.get("roles", [])

        # Direct roles claim fallback
        if not roles and "roles" in payload:
            roles = payload.get("roles", [])

        is_citizen = any(r.upper() == "CITIZEN" for r in roles)
        pref_username = payload.get("preferred_username")
        raw_citizen_id = payload.get("canonical_citizen_id")

        canonical_citizen_id = raw_citizen_id
        if not canonical_citizen_id and is_citizen:
            if pref_username and pref_username.startswith("CIT-"):
                canonical_citizen_id = pref_username
            elif pref_username and pref_username.startswith("citizen_"):
                parts = pref_username.split("_")
                if len(parts) > 1 and parts[1].isdigit():
                    canonical_citizen_id = f"CIT-{int(parts[1]):06d}"

        return UserPayload(
            sub=sub,
            username=payload.get("username", pref_username or sub),
            email=payload.get("email"),
            roles=roles,
            preferred_username=pref_username,
            canonical_citizen_id=canonical_citizen_id,
            department_code=payload.get("department_code")
        )

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"}
        )
