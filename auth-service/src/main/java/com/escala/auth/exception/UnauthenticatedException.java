package com.escala.auth.exception;

public class UnauthenticatedException extends RuntimeException {
    public UnauthenticatedException() {
        super("Autenticação necessária.");
    }
}
