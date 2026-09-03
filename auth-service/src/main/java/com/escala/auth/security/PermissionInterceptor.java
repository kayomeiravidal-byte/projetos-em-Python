package com.escala.auth.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;

public class PermissionInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws IOException {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }
        RequirePermission required = handlerMethod.getMethodAnnotation(RequirePermission.class);
        if (required == null) {
            return true;
        }

        AuthenticatedUser user = (AuthenticatedUser) request.getAttribute(AuthenticationFilter.REQUEST_ATTRIBUTE);
        if (user == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Autenticação necessária.");
            return false;
        }
        if (!user.hasPermission(required.value())) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Permissão insuficiente.");
            return false;
        }
        return true;
    }
}
