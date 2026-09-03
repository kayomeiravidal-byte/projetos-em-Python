package com.escala.auth.security;

import java.util.List;

public record AuthenticatedUser(
        Long userId,
        Long organizationId,
        String email,
        String role,
        List<String> permissions
) {
    public boolean hasPermission(String code) {
        return permissions.contains(code);
    }
}
