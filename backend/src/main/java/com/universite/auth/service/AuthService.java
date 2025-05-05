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
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = tokenProvider.generateToken(authentication);

            User user = (User) authentication.getPrincipal();

            return LoginResponse.builder()
                    .token(jwt)
                    .id(user.getId())
                    .email(user.getEmail())
                    .role(user.getRole().name())
                    .nom(user.getNom())
                    .prenom(user.getPrenom())
                    .build();

        } catch (org.springframework.security.authentication.BadCredentialsException ex) {
            throw new BadCredentialsException("Email ou mot de passe incorrect");
        }
    }
}