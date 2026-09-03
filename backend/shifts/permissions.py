from rest_framework.permissions import BasePermission


class HasPermissionCode(BasePermission):
    """ViewSets: lê view.required_permissions[view.action] e confere contra
    request.user.permissions."""

    def has_permission(self, request, view):
        required = getattr(view, "required_permissions", {}).get(view.action)
        if required is None:
            return True
        user = request.user
        return bool(getattr(user, "is_authenticated", False)) and user.has_permission(required)


def require_permission(code):
    """Para @api_view: exige um código de permissão fixo."""

    class _RequirePermission(BasePermission):
        def has_permission(self, request, view):
            user = request.user
            return bool(getattr(user, "is_authenticated", False)) and user.has_permission(code)

    return _RequirePermission
