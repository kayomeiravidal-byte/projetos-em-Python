package com.escala.auth.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Anotação de autorização "feita à mão" — substitui o @PreAuthorize do
 * Spring Security. Aplicada num método de controller, exige que o
 * AuthenticatedUser da requisição tenha o código de permissão indicado.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequirePermission {
    String value();
}
