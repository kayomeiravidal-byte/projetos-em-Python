"""Gera tokens JWT válidos pra simular requisições autenticadas nos testes."""
import time

from django.conf import settings

from .jwt_codec import encode as jwt_encode

ADMIN_PERMISSIONS = [
    "org:manage", "users:manage", "employees:manage", "rules:manage",
    "schedules:generate", "schedules:write", "schedules:read", "export:excel",
]
SUPERVISOR_PERMISSIONS = [
    "users:manage", "employees:manage", "rules:manage",
    "schedules:generate", "schedules:write", "schedules:read", "export:excel",
]
LIDER_PERMISSIONS = ["schedules:write", "schedules:read", "export:excel"]
FUNCIONARIO_PERMISSIONS = ["schedules:read"]

PERMISSIONS_BY_ROLE = {
    "ADMIN": ADMIN_PERMISSIONS,
    "SUPERVISOR": SUPERVISOR_PERMISSIONS,
    "LIDER": LIDER_PERMISSIONS,
    "FUNCIONARIO": FUNCIONARIO_PERMISSIONS,
}


def make_token(organization_id=1, role="ADMIN", permissions=None, user_id=1, email="admin@test.com"):
    if permissions is None:
        permissions = PERMISSIONS_BY_ROLE.get(role, [])
    now = int(time.time())
    claims = {
        "sub": user_id,
        "orgId": organization_id,
        "email": email,
        "role": role,
        "permissions": permissions,
        "iat": now,
        "exp": now + 900,
    }
    return jwt_encode(claims, settings.JWT_SECRET)


def auth_header(**kwargs) -> str:
    return f"Bearer {make_token(**kwargs)}"
