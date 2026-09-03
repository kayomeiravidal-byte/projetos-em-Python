package com.escala.auth.service;

import com.escala.auth.config.AppProperties;
import com.escala.auth.dto.AuthResponse;
import com.escala.auth.dto.LoginRequest;
import com.escala.auth.dto.RegisterRequest;
import com.escala.auth.exception.InvalidCredentialsException;
import com.escala.auth.exception.InvalidRefreshTokenException;
import com.escala.auth.model.Organization;
import com.escala.auth.model.Permission;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private OrganizationRepository organizationRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private UserRepository userRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;

    @Spy
    private PasswordHasher passwordHasher = new PasswordHasher();

    private final AppProperties properties = new AppProperties(
            new AppProperties.Jwt("test-secret-key-with-at-least-32-bytes!!", 15, 7),
            new AppProperties.Cors(List.of("http://localhost:5173"))
    );
    private final JwtCodec jwtCodec = new JwtCodec(properties);

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(organizationRepository, roleRepository, userRepository,
                refreshTokenRepository, passwordHasher, jwtCodec, properties);
    }

    // Os builders abaixo criam fixtures "genéricas" reaproveitadas por vários
    // testes; nem todo teste exercita todos os getters stubados aqui (ex.:
    // um login que falha antes de chegar em issueTokens() nunca chama
    // getRole()/getPermissions()) — por isso os stubs são lenient(), senão o
    // modo estrito do Mockito reclamaria de "stub não utilizado".

    private Role roleWithPermissions(String name, String... codes) {
        Role role = mock(Role.class);
        lenient().when(role.getName()).thenReturn(name);
        Set<Permission> permissions = new HashSet<>();
        for (String code : codes) {
            Permission permission = mock(Permission.class);
            lenient().when(permission.getCode()).thenReturn(code);
            permissions.add(permission);
        }
        lenient().when(role.getPermissions()).thenReturn(permissions);
        return role;
    }

    private User userFixture(Long id, Organization org, Role role, String email, String passwordHash, boolean active) {
        User user = mock(User.class);
        lenient().when(user.getId()).thenReturn(id);
        lenient().when(user.getOrganization()).thenReturn(org);
        lenient().when(user.getRole()).thenReturn(role);
        lenient().when(user.getEmail()).thenReturn(email);
        lenient().when(user.getPasswordHash()).thenReturn(passwordHash);
        lenient().when(user.isActive()).thenReturn(active);
        return user;
    }

    private Organization orgFixture(Long id, String name) {
        Organization org = mock(Organization.class);
        lenient().when(org.getId()).thenReturn(id);
        lenient().when(org.getName()).thenReturn(name);
        return org;
    }

    // ---- register ----

    @Test
    void registerCreatesOrganizationAndAdminAndReturnsTokens() {
        when(userRepository.existsByEmail("ana@padaria.com")).thenReturn(false);
        Organization savedOrg = orgFixture(1L, "Padaria Central");
        when(organizationRepository.save(any(Organization.class))).thenReturn(savedOrg);
        Role adminRole = roleWithPermissions(RoleNames.ADMIN, "org:manage", "users:manage");
        when(roleRepository.findByName(RoleNames.ADMIN)).thenReturn(Optional.of(adminRole));

        RegisterRequest request = new RegisterRequest("Padaria Central", "Ana Admin", "ana@padaria.com", "senha12345");
        AuthResponse response = authService.register(request);

        assertThat(response.accessToken()).isNotBlank();
        Map<String, Object> claims = jwtCodec.decodeAndVerify(response.accessToken());
        assertThat(claims.get("email")).isEqualTo("ana@padaria.com");
        assertThat(claims.get("role")).isEqualTo("ADMIN");
        @SuppressWarnings("unchecked")
        List<String> permissions = (List<String>) claims.get("permissions");
        assertThat(permissions).containsExactlyInAnyOrder("org:manage", "users:manage");
        verify(userRepository).save(any(User.class));
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    void registerRejectsDuplicateEmail() {
        when(userRepository.existsByEmail("ana@padaria.com")).thenReturn(true);
        RegisterRequest request = new RegisterRequest("Padaria Central", "Ana Admin", "ana@padaria.com", "senha12345");

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(IllegalArgumentException.class);
        verify(organizationRepository, never()).save(any());
    }

    // ---- login ----

    @Test
    void loginSucceedsWithCorrectPassword() {
        Organization org = orgFixture(1L, "Padaria Central");
        Role adminRole = roleWithPermissions(RoleNames.ADMIN, "users:manage");
        String hash = passwordHasher.hash("senha12345");
        User user = userFixture(1L, org, adminRole, "ana@padaria.com", hash, true);
        when(userRepository.findByEmail("ana@padaria.com")).thenReturn(Optional.of(user));

        AuthResponse response = authService.login(new LoginRequest("ana@padaria.com", "senha12345"));

        assertThat(response.accessToken()).isNotBlank();
    }

    @Test
    void loginFailsWithWrongPassword() {
        Organization org = orgFixture(1L, "Padaria Central");
        Role adminRole = roleWithPermissions(RoleNames.ADMIN, "users:manage");
        String hash = passwordHasher.hash("senha12345");
        User user = userFixture(1L, org, adminRole, "ana@padaria.com", hash, true);
        when(userRepository.findByEmail("ana@padaria.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(new LoginRequest("ana@padaria.com", "senha-errada")))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void loginFailsForNonexistentEmail() {
        when(userRepository.findByEmail("ninguem@padaria.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("ninguem@padaria.com", "qualquer")))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void loginFailsForInactiveUser() {
        Organization org = orgFixture(1L, "Padaria Central");
        Role adminRole = roleWithPermissions(RoleNames.ADMIN, "users:manage");
        String hash = passwordHasher.hash("senha12345");
        User user = userFixture(1L, org, adminRole, "ana@padaria.com", hash, false);
        when(userRepository.findByEmail("ana@padaria.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(new LoginRequest("ana@padaria.com", "senha12345")))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void loginRunsPasswordHashingEvenWhenEmailDoesNotExist() {
        // Regressão do ataque de timing: sem o fix, essa chamada retornaria
        // sem nunca invocar passwordHasher.matches(), permitindo enumerar
        // e-mails cadastrados só medindo o tempo de resposta.
        when(userRepository.findByEmail("ninguem@padaria.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("ninguem@padaria.com", "qualquer-coisa")))
                .isInstanceOf(InvalidCredentialsException.class);

        verify(passwordHasher).matches(eq("qualquer-coisa"), anyString());
    }

    // ---- refresh & logout ----

    @Test
    void refreshRotatesTokenAndRevokesOld() {
        Organization org = orgFixture(1L, "Padaria Central");
        Role adminRole = roleWithPermissions(RoleNames.ADMIN, "users:manage");
        User user = userFixture(1L, org, adminRole, "ana@padaria.com", "hash", true);

        RefreshToken stored = mock(RefreshToken.class);
        when(stored.getUser()).thenReturn(user);
        when(stored.isRevoked()).thenReturn(false);
        when(stored.getExpiresAt()).thenReturn(Instant.now().plusSeconds(3600));
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(stored));

        AuthResponse response = authService.refresh("some-refresh-token");

        assertThat(response.accessToken()).isNotBlank();
        verify(stored).revoke();
        verify(refreshTokenRepository).save(stored);
    }

    @Test
    void refreshRejectsRevokedToken() {
        RefreshToken stored = mock(RefreshToken.class);
        when(stored.isRevoked()).thenReturn(true);
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(stored));

        assertThatThrownBy(() -> authService.refresh("some-refresh-token"))
                .isInstanceOf(InvalidRefreshTokenException.class);
    }

    @Test
    void refreshRejectsExpiredToken() {
        RefreshToken stored = mock(RefreshToken.class);
        when(stored.isRevoked()).thenReturn(false);
        when(stored.getExpiresAt()).thenReturn(Instant.now().minusSeconds(3600));
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(stored));

        assertThatThrownBy(() -> authService.refresh("some-refresh-token"))
                .isInstanceOf(InvalidRefreshTokenException.class);
    }

    @Test
    void refreshRejectsUnknownToken() {
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.refresh("unknown-token"))
                .isInstanceOf(InvalidRefreshTokenException.class);
    }

    @Test
    void logoutRevokesToken() {
        RefreshToken stored = mock(RefreshToken.class);
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(stored));

        authService.logout("some-refresh-token");

        verify(stored).revoke();
        verify(refreshTokenRepository).save(stored);
    }

    @Test
    void logoutIsNoOpForUnknownToken() {
        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.empty());

        authService.logout("unknown-token");

        verify(refreshTokenRepository, never()).save(any());
    }
}
