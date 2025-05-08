package com.universite.auth.service;

import com.universite.auth.dto.LoginRequest;
import com.universite.auth.dto.LoginResponse;
import com.universite.auth.entity.User;
import com.universite.auth.exception.BadCredentialsException;
import com.universite.auth.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    public LoginResponse authenticate(LoginRequest loginRequest) {
        try {
            System.out.println("=====================================================");
            System.out.println("Tentative d'authentification pour l'email: " + loginRequest.getEmail());
            System.out.println("Mot de passe fourni (longueur): " + (loginRequest.getPassword() != null ? loginRequest.getPassword().length() : "null"));

            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    loginRequest.getEmail(),
                    loginRequest.getPassword()
            );

            System.out.println("Token d'authentification créé: " + authToken);

            Authentication authentication = authenticationManager.authenticate(authToken);

            System.out.println("Authentification réussie pour l'email: " + loginRequest.getEmail());
            System.out.println("Principal: " + authentication.getPrincipal());
            System.out.println("Autorités: " + authentication.getAuthorities());

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = tokenProvider.generateToken(authentication);

            System.out.println("JWT Token généré avec succès, longueur: " + jwt.length());

            User user = (User) authentication.getPrincipal();
            System.out.println("User ID: " + user.getId() + ", Rôle: " + user.getRole());

            System.out.println("=====================================================");

            return LoginResponse.builder()
                    .token(jwt)
                    .id(user.getId())
                    .email(user.getEmail())
                    .role(user.getRole().name())
                    .nom(user.getNom())
                    .prenom(user.getPrenom())
                    .build();

        } catch (Exception ex) {
            System.err.println("=====================================================");
            System.err.println("Erreur d'authentification pour l'email: " + loginRequest.getEmail());
            System.err.println("Message d'erreur: " + ex.getMessage());
            System.err.println("Type d'exception: " + ex.getClass().getName());
            ex.printStackTrace();
            System.err.println("=====================================================");
            throw new BadCredentialsException("Email ou mot de passe incorrect");
        }
    }
}