from __future__ import annotations

import uuid

from app.core.exceptions import ForbiddenError

ADMIN_ROLES = frozenset({"owner", "admin"})
MANAGER_ROLES = frozenset({"owner", "admin", "manager"})


def require_owner(resource, user_id: uuid.UUID, *, label: str = "resource") -> None:
    if resource.created_by != user_id:
        raise ForbiddenError(f"You do not have permission to modify this {label}")


def check_owner_or_admin(
    resource, user_id: uuid.UUID,
    member_role: str | None = None,
    *,
    label: str = "resource",
) -> None:
    if member_role is not None and member_role in ADMIN_ROLES:
        return
    require_owner(resource, user_id, label=label)


def require_admin(member_role: str) -> None:
    if member_role not in ADMIN_ROLES:
        raise ForbiddenError("Admin privileges required")
