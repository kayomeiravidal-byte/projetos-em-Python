package com.escala.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateOrgUserRequest(
        @NotBlank @Size(max = 150) String name,
        @Email @NotBlank @Size(max = 255) String email,
        @NotBlank @Size(min = 8, max = 128, message = "A senha precisa ter pelo menos 8 caracteres.") String password,
        @NotBlank String role
) {
}
