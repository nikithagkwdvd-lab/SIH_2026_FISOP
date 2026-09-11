from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.security.jwt_validator import UserPayload
from app.services.identity_service import IdentityResolutionService


def require_role(*allowed_roles: str):
    """
    FastAPI dependency factory enforcing Role-Based Access Control (RBAC).
    Rejects requests lacking the required role with HTTP 403 Forbidden.
    """
    def role_checker(current_user: UserPayload) -> UserPayload:
        user_roles_upper = [r.upper() for r in current_user.roles]
        allowed_upper = [r.upper() for r in allowed_roles]

        # Check if user has any of the allowed roles
        has_role = any(r in user_roles_upper for r in allowed_upper)
        if not has_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: User requires one of the following roles: {list(allowed_roles)}"
            )
        return current_user

    return role_checker


def verify_citizen_ownership(
    current_user: UserPayload,
    target_citizen_id: str,
    db: Session
) -> None:
    """
    Enforces Citizen-Scoped Data Protection.
    Ensures a CITIZEN can ONLY access their own records.
    CIT-000001 user attempting to access CIT-000002 receives HTTP 403 Forbidden.
    """
    user_roles_upper = [r.upper() for r in current_user.roles]

    if "CITIZEN" in user_roles_upper and "ADMIN" not in user_roles_upper and "DEPARTMENT_OFFICIAL" not in user_roles_upper and "OPERATIONS" not in user_roles_upper:
        identity_service = IdentityResolutionService(db)

        user_identity = identity_service.resolve_citizen(
            current_user.preferred_username or current_user.username
        )
        target_identity = identity_service.resolve_citizen(target_citizen_id)

        if not user_identity or not target_identity:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Citizens can only access their own records"
            )

        same_uuid = user_identity.citizen_uuid and target_identity.citizen_uuid and (user_identity.citizen_uuid == target_identity.citizen_uuid)
        same_label = user_identity.canonical_id == target_identity.canonical_id

        if not (same_uuid or same_label):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Citizens can only access their own records"
            )



def verify_department_access(
    current_user: UserPayload,
    target_department_code: str
) -> None:
    """
    Enforces Department-Aware Authorization for Department Officials.
    Revenue official cannot access Land or Welfare endpoints directly.
    """
    user_roles_upper = [r.upper() for r in current_user.roles]

    if "DEPARTMENT_OFFICIAL" in user_roles_upper and "ADMIN" not in user_roles_upper:
        user_dept = current_user.department_code
        if not user_dept or user_dept.upper() != target_department_code.upper():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Official is not authorized for department '{target_department_code}'"
            )
