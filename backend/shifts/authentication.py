from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .jwt_codec import JwtError, decode_and_verify


class RemoteUser:
    is_authenticated = True

    def __init__(self, claims: dict):
        self.id = claims.get("sub")
        self.organization_id = claims.get("orgId")
        self.email = claims.get("email")
        self.role = claims.get("role")
        self.permissions = claims.get("permissions") or []

    def has_permission(self, code: str) -> bool:
        return code in self.permissions

    def __str__(self):
        return self.email or f"user:{self.id}"


class JWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        header = request.META.get("HTTP_AUTHORIZATION", "")
        if not header.startswith("Bearer "):
            return None

        token = header[len("Bearer "):]
        try:
            claims = decode_and_verify(token, settings.JWT_SECRET)
        except JwtError as exc:
            raise AuthenticationFailed(str(exc))

        return (RemoteUser(claims), token)

    def authenticate_header(self, request):
        return "Bearer"
