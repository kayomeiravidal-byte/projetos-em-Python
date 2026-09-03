package com.escala.auth.exception;

public class NotFoundException extends RuntimeException {
    public NotFoundException() {
        super("Recurso não encontrado.");
    }
}
