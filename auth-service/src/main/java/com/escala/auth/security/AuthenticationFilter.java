package com.escala.auth.security;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * Lê o header Authorization: Bearer, valida o JWT via JwtCodec e anexa um
 * AuthenticatedUser como atributo da requisição. Não decide sozinho se a
 * rota exige autenticação — quem barra o acesso é o PermissionInterceptor
 * (ou o próprio controller, para rotas que só exigem "estar logado").
 */
@Component
public class AuthenticationFilter implements Filter {

    public static final String REQUEST_ATTRIBUTE = "authenticatedUser";

    private final JwtCodec jwtCodec;

    public AuthenticationFilter(JwtCodec jwtCodec) {
        this.jwtCodec = jwtCodec;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String header = httpRequest.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring("Bearer ".length());
            try {
                Map<String, Object> claims = jwtCodec.decodeAndVerify(token);
                request.setAttribute(REQUEST_ATTRIBUTE, toAuthenticatedUser(claims));
            } catch (JwtException ignored) {
                // token ausente/expirado/inválido: segue sem usuário autenticado
            }
        }

        chain.doFilter(request, response);
    }

    @SuppressWarnings("unchecked")
    private AuthenticatedUser toAuthenticatedUser(Map<String, Object> claims) {
        return new AuthenticatedUser(
                ((Number) claims.get("sub")).longValue(),
                ((Number) claims.get("orgId")).longValue(),
                (String) claims.get("email"),
                (String) claims.get("role"),
                (List<String>) claims.get("permissions")
        );
    }
}
