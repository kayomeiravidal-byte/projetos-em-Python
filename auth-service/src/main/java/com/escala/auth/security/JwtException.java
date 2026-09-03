package com.escala.auth.security;

public class JwtException extends RuntimeException {
    public JwtException(String message) {
        super(message);
    }
}
