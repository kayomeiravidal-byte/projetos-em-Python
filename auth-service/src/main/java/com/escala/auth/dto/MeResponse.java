package com.escala.auth.dto;

import com.escala.auth.security.AuthenticatedUser;

import java.util.List;

public record MeResponse(Long userId, Long organizationId, String email, String role, List<String> permissions) {
    public static MeResponse from(AuthenticatedUser user) {
        return new MeResponse(user.userId(), user.organizationId(), user.email(), user.role(), user.permissions());
    }
}
