package com.universite.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChangePasswordRequest {

    @NotBlank(message = "L'ancien mot de passe est requis")
    private String oldPassword;

    @NotBlank(message = "Le nouveau mot de passe est requis")
    private String newPassword;
}