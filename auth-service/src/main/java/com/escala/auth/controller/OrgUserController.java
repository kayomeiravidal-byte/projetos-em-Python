package com.escala.auth.controller;

import com.escala.auth.dto.CreateOrgUserRequest;
import com.escala.auth.dto.OrgUserResponse;
import com.escala.auth.dto.UpdateOrgUserRequest;
import com.escala.auth.security.AuthenticatedUser;
import com.escala.auth.security.RequirePermission;
import com.escala.auth.service.OrgUserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/org/users")
public class OrgUserController {

    private final OrgUserService orgUserService;

    public OrgUserController(OrgUserService orgUserService) {
        this.orgUserService = orgUserService;
    }

    @GetMapping
    @RequirePermission("users:manage")
    public List<OrgUserResponse> list(AuthenticatedUser currentUser) {
        return orgUserService.list(currentUser);
    }

    @PostMapping
    @RequirePermission("users:manage")
    @ResponseStatus(HttpStatus.CREATED)
    public OrgUserResponse create(AuthenticatedUser currentUser, @Valid @RequestBody CreateOrgUserRequest request) {
        return orgUserService.create(currentUser, request);
    }

    @PutMapping("/{id}")
    @RequirePermission("users:manage")
    public OrgUserResponse update(AuthenticatedUser currentUser, @PathVariable Long id,
                                   @RequestBody UpdateOrgUserRequest request) {
        return orgUserService.updateRole(currentUser, id, request);
    }
}
