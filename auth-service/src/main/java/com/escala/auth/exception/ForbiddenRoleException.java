package com.escala.auth.exception;

public class ForbiddenRoleException extends RuntimeException {
    public ForbiddenRoleException() {
        super("Você não tem permissão para atribuir ou gerenciar esse papel.");
    }
}
