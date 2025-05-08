package com.universite.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserDetailsServiceImpl userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String requestURI = request.getRequestURI();
        String method = request.getMethod();

        System.out.println("========== JWT FILTER ==========");
        System.out.println("JwtAuthenticationFilter - Request: " + method + " " + requestURI);

        // Pour les endpoints d'authentification, on passe directement sans vérifier le token
        if (requestURI.contains("/api/auth/login") || requestURI.contains("/api/auth/register")) {
            System.out.println("JwtAuthenticationFilter - Bypassing filter for auth endpoint: " + requestURI);
            filterChain.doFilter(request, response);
            System.out.println("========== JWT FILTER END ==========");
            return;
        }

        String token = getTokenFromRequest(request);
        System.out.println("JwtAuthenticationFilter - Token présent: " + (StringUtils.hasText(token) ? "Oui" : "Non"));

        if (StringUtils.hasText(token)) {
            try {
                if (tokenProvider.validateToken(token)) {
                    String username = tokenProvider.getUsernameFromToken(token);
                    System.out.println("JwtAuthenticationFilter - Token valide pour l'utilisateur: " + username);

                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );

                    authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                    System.out.println("JwtAuthenticationFilter - Authentification définie dans SecurityContext");
                } else {
                    System.out.println("JwtAuthenticationFilter - Token invalide");
                }
            } catch (Exception e) {
                System.err.println("JwtAuthenticationFilter - Erreur lors de la validation du token: " + e.getMessage());
            }
        } else {
            System.out.println("JwtAuthenticationFilter - Pas de token JWT dans la requête");
        }

        System.out.println("JwtAuthenticationFilter - Passage à la suite de la chaîne de filtres");
        filterChain.doFilter(request, response);
        System.out.println("========== JWT FILTER END ==========");
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");

        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }

        return null;
    }
}