package com.escala.auth.dto;

import com.escala.auth.model.User;

import java.time.Instant;

public record OrgUserResponse(Long id, String name, String email, String role, boolean active, Instant createdAt) {
    public static OrgUserResponse from(User user) {
        return new OrgUserResponse(
                user.getId(), user.getName(), user.getEmail(),
                user.getRole().getName(), user.isActive(), user.getCreatedAt()
        );
    }
}
