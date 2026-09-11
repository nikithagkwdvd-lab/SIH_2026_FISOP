import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.db.database import get_db
from app.db.models.notification import Notification, NotificationStatus
from app.db.models.citizen import Citizen
from app.security.jwt_validator import get_current_user, UserPayload
from app.security.rbac import verify_citizen_ownership
from app.services.identity_service import IdentityResolutionService
from app.schemas.application_schemas import NotificationResponse, NotificationListResponse

router = APIRouter(prefix="/api/notifications", tags=["Citizen Real-Time In-App Notifications"])


@router.get(
    "",
    response_model=NotificationListResponse,
    summary="Get List of In-App Notifications for Authenticated Citizen"
)
async def list_notifications(
    db: Session = Depends(get_db),
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Retrieves real DB-backed in-app notifications for the logged-in citizen.
    Includes total count and unread_count for the notification bell badge.
    """
    user_roles_upper = [r.upper() for r in current_user.roles]
    identity_service = IdentityResolutionService(db)

    if "ADMIN" in user_roles_upper or "OPERATIONS" in user_roles_upper:
        # Admin / Ops can see all notifications
        notifs = db.scalars(
            select(Notification).order_by(Notification.created_at.desc())
        ).all()
    else:
        identity = identity_service.resolve_citizen(
            current_user.preferred_username or current_user.username
        )
        if not identity or not identity.citizen_uuid:
            return NotificationListResponse(total=0, unread_count=0, notifications=[])

        notifs = db.scalars(
            select(Notification)
            .where(Notification.citizen_id == identity.citizen_uuid)
            .order_by(Notification.created_at.desc())
        ).all()

    unread_count = sum(1 for n in notifs if not n.is_read)
    
    response_items = [
        NotificationResponse(
            id=n.id,
            citizen_id=n.citizen_id,
            application_id=n.application_id,
            type=n.type,
            message=n.message,
            status=n.status,
            is_read=n.is_read,
            created_at=n.created_at,
            updated_at=n.updated_at
        )
        for n in notifs
    ]

    return NotificationListResponse(
        total=len(response_items),
        unread_count=unread_count,
        notifications=response_items
    )


@router.post(
    "/{notification_id}/read",
    response_model=NotificationResponse,
    summary="Mark In-App Notification as Read"
)
async def mark_notification_read(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Marks a specific notification as read (is_read=True).
    Enforces citizen ownership so citizens can only modify their own notifications.
    """
    notif = db.get(Notification, notification_id)
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification '{notification_id}' not found"
        )

    user_roles_upper = [r.upper() for r in current_user.roles]
    if "ADMIN" not in user_roles_upper and "OPERATIONS" not in user_roles_upper:
        identity_service = IdentityResolutionService(db)
        identity = identity_service.resolve_citizen(
            current_user.preferred_username or current_user.username
        )
        if not identity or not identity.citizen_uuid or notif.citizen_id != identity.citizen_uuid:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Cannot mark notifications belonging to another citizen"
            )

    notif.is_read = True
    notif.status = NotificationStatus.READ
    db.commit()
    db.refresh(notif)

    return NotificationResponse(
        id=notif.id,
        citizen_id=notif.citizen_id,
        application_id=notif.application_id,
        type=notif.type,
        message=notif.message,
        status=notif.status,
        is_read=notif.is_read,
        created_at=notif.created_at,
        updated_at=notif.updated_at
    )
