package com.escala.auth.dto;

public record AuthResponse(String accessToken, String refreshToken, long expiresIn) {
}
