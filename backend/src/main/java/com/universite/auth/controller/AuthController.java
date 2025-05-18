package com.universite.auth.controller;

import com.universite.auth.dto.ApiResponse;
import com.universite.auth.dto.LoginRequest;
import com.universite.auth.dto.LoginResponse;
import com.universite.auth.dto.UserDto;
import com.universite.auth.dto.ChangePasswordRequest;
import com.universite.auth.entity.User;
import com.universite.auth.service.AuthService;
import com.universite.auth.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        LoginResponse loginResponse = authService.authenticate(loginRequest);
        return ResponseEntity.ok(loginResponse);
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            // Retourner une erreur 401 Unauthorized au lieu d'une 500
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse(false, "Utilisateur non authentifié"));
        }

        UserDto userDto = userService.getUserById(currentUser.getId());
        return ResponseEntity.ok(userDto);
    }

    @PostMapping("/validate-token")
    public ResponseEntity<ApiResponse> validateToken() {
        // Si nous arrivons ici, c'est que le token est valide car il a passé le filtre JwtAuthenticationFilter
        return ResponseEntity.ok(new ApiResponse(true, "Token valide"));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse> changePassword(
            @AuthenticationPrincipal User currentUser,
            @RequestBody ChangePasswordRequest changePasswordRequest) {

        System.out.println("=== CHANGEMENT DE MOT DE PASSE ===");
        System.out.println("Utilisateur: " + currentUser.getEmail());
        System.out.println("Ancien mot de passe fourni: " + (changePasswordRequest.getOldPassword() != null ? "***" : "null"));
        System.out.println("Nouveau mot de passe fourni: " + (changePasswordRequest.getNewPassword() != null ? "***" : "null"));

        try {
            userService.changePassword(
                    currentUser.getId(),
                    changePasswordRequest.getOldPassword(),
                    changePasswordRequest.getNewPassword()
            );

            System.out.println("Mot de passe changé avec succès pour: " + currentUser.getEmail());
            return ResponseEntity.ok(new ApiResponse(true, "Mot de passe modifié avec succès"));
        } catch (Exception e) {
            System.err.println("Erreur lors du changement de mot de passe: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}