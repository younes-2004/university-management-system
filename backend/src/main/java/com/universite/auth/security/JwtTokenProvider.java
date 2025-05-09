package com.universite.auth.security;

import com.universite.auth.exception.BadCredentialsException;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private int jwtExpirationInMs;

    private Key signingKey;

    @PostConstruct
    public void init() {
        // Initialiser la clé une seule fois au démarrage
        signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
        System.out.println("JWT: Clé de signature initialisée avec succès (algorithme HS256)");
    }

    private Key getSigningKey() {
        return signingKey;
    }

    public String generateToken(Authentication authentication) {
        String username = authentication.getName();
        Date currentDate = new Date();
        Date expireDate = new Date(currentDate.getTime() + jwtExpirationInMs);

        System.out.println("JWT: Génération d'un token pour l'utilisateur: " + username);

        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(currentDate)
                .setExpiration(expireDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String getUsernameFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        String username = claims.getSubject();
        System.out.println("JWT: Extraction du nom d'utilisateur du token: " + username);
        return username;
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (SecurityException ex) {
            System.err.println("JWT: Signature invalide: " + ex.getMessage());
            throw new BadCredentialsException("Invalid JWT signature");
        } catch (MalformedJwtException ex) {
            System.err.println("JWT: Token malformé: " + ex.getMessage());
            throw new BadCredentialsException("Invalid JWT token");
        } catch (ExpiredJwtException ex) {
            System.err.println("JWT: Token expiré: " + ex.getMessage());
            throw new BadCredentialsException("Expired JWT token");
        } catch (UnsupportedJwtException ex) {
            System.err.println("JWT: Token non supporté: " + ex.getMessage());
            throw new BadCredentialsException("Unsupported JWT token");
        } catch (IllegalArgumentException ex) {
            System.err.println("JWT: Claims vides: " + ex.getMessage());
            throw new BadCredentialsException("JWT claims string is empty");
        }
    }
}