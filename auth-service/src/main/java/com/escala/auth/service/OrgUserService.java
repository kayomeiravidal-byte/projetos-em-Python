package com.escala.auth.service;

import com.escala.auth.dto.CreateOrgUserRequest;
import com.escala.auth.dto.OrgUserResponse;
import com.escala.auth.dto.UpdateOrgUserRequest;
import com.escala.auth.exception.ForbiddenRoleException;
import com.escala.auth.exception.NotFoundException;
import com.escala.auth.model.Role;
import com.escala.auth.model.RoleNames;
import com.escala.auth.model.User;
import com.escala.auth.repository.OrganizationRepository;
import com.escala.auth.repository.RoleRepository;
import com.escala.auth.repository.UserRepository;
import com.escala.auth.security.AuthenticatedUser;
import com.escala.auth.security.PasswordHasher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class OrgUserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordHasher passwordHasher;

    public OrgUserService(UserRepository userRepository, RoleRepository roleRepository,
                           OrganizationRepository organizationRepository, PasswordHasher passwordHasher) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.organizationRepository = organizationRepository;
        this.passwordHasher = passwordHasher;
    }

    public List<OrgUserResponse> list(AuthenticatedUser caller) {
        return userRepository.findByOrganizationId(caller.organizationId()).stream()
                .map(OrgUserResponse::from)
                .toList();
    }

    @Transactional
    public OrgUserResponse create(AuthenticatedUser caller, CreateOrgUserRequest request) {
        Role targetRole = requireRoleBelowCaller(caller, request.role());
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Já existe uma conta com este e-mail.");
        }

        User user = new User(
                organizationRepository.getReferenceById(caller.organizationId()),
                targetRole,
                request.name(),
                request.email(),
                passwordHasher.hash(request.password())
        );
        return OrgUserResponse.from(userRepository.save(user));
    }

    @Transactional
    public OrgUserResponse updateRole(AuthenticatedUser caller, Long targetUserId, UpdateOrgUserRequest request) {
        User target = userRepository.findByIdAndOrganizationId(targetUserId, caller.organizationId())
                .orElseThrow(NotFoundException::new);

        if (!RoleNames.isStrictlyBelow(target.getRole().getName(), caller.role())) {
            throw new ForbiddenRoleException();
        }

        if (request.role() != null) {
            target.setRole(requireRoleBelowCaller(caller, request.role()));
        }
        if (request.active() != null) {
            target.setActive(request.active());
        }
        return OrgUserResponse.from(userRepository.save(target));
    }

    private Role requireRoleBelowCaller(AuthenticatedUser caller, String requestedRole) {
        if (!RoleNames.isStrictlyBelow(requestedRole, caller.role())) {
            throw new ForbiddenRoleException();
        }
        return roleRepository.findByName(requestedRole)
                .orElseThrow(() -> new IllegalArgumentException("Papel desconhecido: " + requestedRole));
    }
}
