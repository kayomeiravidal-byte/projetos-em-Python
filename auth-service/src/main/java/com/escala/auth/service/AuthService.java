package com.escala.auth.service;

import com.escala.auth.config.AppProperties;
import com.escala.auth.dto.AuthResponse;
import com.escala.auth.dto.LoginRequest;
import com.escala.auth.dto.RegisterRequest;
import com.escala.auth.exception.InvalidCredentialsException;
import com.escala.auth.exception.InvalidRefreshTokenException;
import com.escala.auth.model.Organization;
import com.escala.auth.model.RefreshToken;
import com.escala.auth.model.Role;
import com.escala.auth.model.RoleNames;
import com.escala.auth.model.User;
import com.escala.auth.repository.OrganizationRepository;
import com.escala.auth.repository.RefreshTokenRepository;
import com.escala.auth.repository.RoleRepository;
import com.escala.auth.repository.UserRepository;
import com.escala.auth.security.JwtCodec;
import com.escala.auth.security.PasswordHasher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final OrganizationRepository organizationRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordHasher passwordHasher;
    private final JwtCodec jwtCodec;
    private final AppProperties properties;

    private final String dummyPasswordHash;

    public AuthService(OrganizationRepository organizationRepository, RoleRepository roleRepository,
                        UserRepository userRepository, RefreshTokenRepository refreshTokenRepository,
                        PasswordHasher passwordHasher, JwtCodec jwtCodec, AppProperties properties) {
        this.organizationRepository = organizationRepository;
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordHasher = passwordHasher;
        this.jwtCodec = jwtCodec;
        this.properties = properties;
        this.dummyPasswordHash = passwordHasher.hash(UUID.randomUUID().toString());
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Já existe uma conta com este e-mail.");
        }

        Organization organization = organizationRepository.save(new Organization(request.organizationName()));
        Role adminRole = roleRepository.findByName(RoleNames.ADMIN)
                .orElseThrow(() -> new IllegalStateException("Papel ADMIN não encontrado — rode as migrations."));

        User user = new User(organization, adminRole, request.name(), request.email(),
                passwordHasher.hash(request.password()));
        userRepository.save(user);

        return issueTokens(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        Optional<User> maybeUser = userRepository.findByEmail(request.email()).filter(User::isActive);

        String hashToVerify = maybeUser.map(User::getPasswordHash).orElse(dummyPasswordHash);
        boolean passwordMatches = passwordHasher.matches(request.password(), hashToVerify);

        if (maybeUser.isEmpty() || !passwordMatches) {
            throw new InvalidCredentialsException();
        }
        return issueTokens(maybeUser.get());
    }

    @Transactional
    public AuthResponse refresh(String rawRefreshToken) {
        String tokenHash = hashToken(rawRefreshToken);
        RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(InvalidRefreshTokenException::new);

        if (stored.isRevoked() || stored.getExpiresAt().isBefore(Instant.now())) {
            throw new InvalidRefreshTokenException();
        }
        stored.revoke();
        refreshTokenRepository.save(stored);

        return issueTokens(stored.getUser());
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        String tokenHash = hashToken(rawRefreshToken);
        refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
            token.revoke();
            refreshTokenRepository.save(token);
        });
    }

    private AuthResponse issueTokens(User user) {
        Instant now = Instant.now();
        Instant accessExpiry = now.plus(properties.jwt().accessTokenMinutes(), ChronoUnit.MINUTES);

        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put("sub", user.getId());
        claims.put("orgId", user.getOrganization().getId());
        claims.put("email", user.getEmail());
        claims.put("role", user.getRole().getName());
        claims.put("permissions", user.getRole().getPermissions().stream()
                .map(permission -> permission.getCode())
                .collect(Collectors.toList()));
        claims.put("iat", now.getEpochSecond());
        claims.put("exp", accessExpiry.getEpochSecond());

        String accessToken = jwtCodec.encode(claims);

        String rawRefreshToken = UUID.randomUUID().toString();
        Instant refreshExpiry = now.plus(properties.jwt().refreshTokenDays(), ChronoUnit.DAYS);
        refreshTokenRepository.save(new RefreshToken(user, hashToken(rawRefreshToken), refreshExpiry));

        long expiresIn = properties.jwt().accessTokenMinutes() * 60;
        return new AuthResponse(accessToken, rawRefreshToken, expiresIn);
    }

    private String hashToken(String rawToken) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
