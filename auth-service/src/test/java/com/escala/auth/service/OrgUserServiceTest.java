package com.escala.auth.service;

import com.escala.auth.dto.CreateOrgUserRequest;
import com.escala.auth.dto.OrgUserResponse;
import com.escala.auth.dto.UpdateOrgUserRequest;
import com.escala.auth.exception.ForbiddenRoleException;
import com.escala.auth.exception.NotFoundException;
import com.escala.auth.model.Organization;
import com.escala.auth.model.Role;
import com.escala.auth.model.RoleNames;
import com.escala.auth.model.User;
import com.escala.auth.repository.OrganizationRepository;
import com.escala.auth.repository.RoleRepository;
import com.escala.auth.repository.UserRepository;
import com.escala.auth.security.AuthenticatedUser;
import com.escala.auth.security.PasswordHasher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrgUserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private OrganizationRepository organizationRepository;

    private final PasswordHasher passwordHasher = new PasswordHasher();
    private OrgUserService orgUserService;

    @BeforeEach
    void setUp() {
        orgUserService = new OrgUserService(userRepository, roleRepository, organizationRepository, passwordHasher);
    }

    private Role roleFixture(String name) {
        Role role = mock(Role.class);
        // lenient: nem todo teste chega a ler o nome do papel de volta.
        lenient().when(role.getName()).thenReturn(name);
        return role;
    }

    private AuthenticatedUser caller(String role) {
        return new AuthenticatedUser(1L, 10L, "caller@padaria.com", role, List.of("users:manage"));
    }

    // ---- hierarquia: quem pode criar quem ----

    @ParameterizedTest
    @CsvSource({
            "ADMIN, SUPERVISOR",
            "ADMIN, LIDER",
            "ADMIN, FUNCIONARIO",
            "SUPERVISOR, LIDER",
            "SUPERVISOR, FUNCIONARIO",
            "LIDER, FUNCIONARIO",
    })
    void allowsCreatingAUserWithAStrictlyLowerRole(String callerRole, String targetRole) {
        Role targetRoleFixture = roleFixture(targetRole);
        Organization orgFixture = mock(Organization.class);
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(roleRepository.findByName(targetRole)).thenReturn(Optional.of(targetRoleFixture));
        when(organizationRepository.getReferenceById(10L)).thenReturn(orgFixture);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CreateOrgUserRequest request = new CreateOrgUserRequest("Novo", "novo@padaria.com", "senha12345", targetRole);

        OrgUserResponse response = orgUserService.create(caller(callerRole), request);

        assertThat(response.role()).isEqualTo(targetRole);
    }

    @ParameterizedTest
    @CsvSource({
            "ADMIN, ADMIN",
            "SUPERVISOR, ADMIN",
            "SUPERVISOR, SUPERVISOR",
            "LIDER, ADMIN",
            "LIDER, SUPERVISOR",
            "LIDER, LIDER",
            "FUNCIONARIO, ADMIN",
            "FUNCIONARIO, FUNCIONARIO",
    })
    void blocksCreatingAUserWithAnEqualOrHigherRole(String callerRole, String targetRole) {
        CreateOrgUserRequest request = new CreateOrgUserRequest("Novo", "novo@padaria.com", "senha12345", targetRole);

        assertThatThrownBy(() -> orgUserService.create(caller(callerRole), request))
                .isInstanceOf(ForbiddenRoleException.class);
    }

    @Test
    void authorizationIsCheckedBeforeRevealingDuplicateEmail() {
        // Uma tentativa sem autorização deve falhar por permissão, não vazar
        // se o e-mail já existe no sistema.
        CreateOrgUserRequest request = new CreateOrgUserRequest("Novo", "existente@padaria.com", "senha12345", RoleNames.ADMIN);

        assertThatThrownBy(() -> orgUserService.create(caller(RoleNames.SUPERVISOR), request))
                .isInstanceOf(ForbiddenRoleException.class);
        verify(userRepository, never()).existsByEmail(any());
    }

    @Test
    void rejectsDuplicateEmailOnCreate() {
        Role funcionarioRole = roleFixture(RoleNames.FUNCIONARIO);
        when(roleRepository.findByName(RoleNames.FUNCIONARIO)).thenReturn(Optional.of(funcionarioRole));
        when(userRepository.existsByEmail("existente@padaria.com")).thenReturn(true);
        CreateOrgUserRequest request = new CreateOrgUserRequest(
                "Novo", "existente@padaria.com", "senha12345", RoleNames.FUNCIONARIO);

        assertThatThrownBy(() -> orgUserService.create(caller(RoleNames.ADMIN), request))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void newUserBelongsToCallerOrganizationRegardlessOfInput() {
        Role funcionarioRole = roleFixture(RoleNames.FUNCIONARIO);
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(roleRepository.findByName(RoleNames.FUNCIONARIO)).thenReturn(Optional.of(funcionarioRole));
        Organization callerOrg = mock(Organization.class);
        when(organizationRepository.getReferenceById(10L)).thenReturn(callerOrg);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CreateOrgUserRequest request = new CreateOrgUserRequest(
                "Novo", "novo@padaria.com", "senha12345", RoleNames.FUNCIONARIO);
        orgUserService.create(caller(RoleNames.ADMIN), request);

        verify(userRepository).save(argThat(user -> user.getOrganization() == callerOrg));
    }

    @Test
    void listOnlyReturnsUsersFromCallerOrganization() {
        orgUserService.list(caller(RoleNames.ADMIN));

        verify(userRepository).findByOrganizationId(10L);
    }

    // ---- updateRole ----

    @Test
    void updateRoleFailsWhenTargetNotFoundInCallerOrganization() {
        when(userRepository.findByIdAndOrganizationId(99L, 10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                orgUserService.updateRole(caller(RoleNames.ADMIN), 99L, new UpdateOrgUserRequest(null, false)))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void updateRoleFailsWhenTargetIsNotBelowCaller() {
        User targetAdmin = mock(User.class);
        Role adminRole = roleFixture(RoleNames.ADMIN);
        when(targetAdmin.getRole()).thenReturn(adminRole);
        when(userRepository.findByIdAndOrganizationId(2L, 10L)).thenReturn(Optional.of(targetAdmin));

        assertThatThrownBy(() ->
                orgUserService.updateRole(caller(RoleNames.SUPERVISOR), 2L, new UpdateOrgUserRequest(null, false)))
                .isInstanceOf(ForbiddenRoleException.class);
    }

    @Test
    void updateRoleDeactivatesASubordinate() {
        User targetFuncionario = mock(User.class);
        Role funcionarioRole = roleFixture(RoleNames.FUNCIONARIO);
        when(targetFuncionario.getRole()).thenReturn(funcionarioRole);
        when(targetFuncionario.getName()).thenReturn("Carla");
        when(targetFuncionario.getEmail()).thenReturn("carla@padaria.com");
        when(targetFuncionario.isActive()).thenReturn(false);
        when(targetFuncionario.getCreatedAt()).thenReturn(Instant.now());
        when(userRepository.findByIdAndOrganizationId(3L, 10L)).thenReturn(Optional.of(targetFuncionario));
        when(userRepository.save(targetFuncionario)).thenReturn(targetFuncionario);

        OrgUserResponse response = orgUserService.updateRole(
                caller(RoleNames.ADMIN), 3L, new UpdateOrgUserRequest(null, false));

        verify(targetFuncionario).setActive(false);
        assertThat(response.active()).isFalse();
    }

    @Test
    void updateRoleCannotPromoteBeyondCallerLevel() {
        User targetFuncionario = mock(User.class);
        Role funcionarioRole = roleFixture(RoleNames.FUNCIONARIO);
        when(targetFuncionario.getRole()).thenReturn(funcionarioRole);
        when(userRepository.findByIdAndOrganizationId(3L, 10L)).thenReturn(Optional.of(targetFuncionario));

        assertThatThrownBy(() -> orgUserService.updateRole(
                caller(RoleNames.SUPERVISOR), 3L, new UpdateOrgUserRequest(RoleNames.SUPERVISOR, null)))
                .isInstanceOf(ForbiddenRoleException.class);
    }
}
