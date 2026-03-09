package tn.esprit.activities.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expires-in:7d}")
    private String expiresIn;

    @PostConstruct
    public void validateSecret() {
        if (jwtSecret == null || jwtSecret.length() < 32) {
            throw new IllegalStateException("JWT secret must be at least 32 characters");
        }
    }

    public String generateToken(String userId, String email, String role) {
        Instant now = Instant.now();
        Instant expiry = now.plus(parseExpiresInSeconds(expiresIn), ChronoUnit.SECONDS);

        return Jwts.builder()
                .subject(userId)
                .claims(Map.of("email", email, "role", role))
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(getSignInKey())
                .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith((javax.crypto.SecretKey) getSignInKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractUserId(String token) {
        return parseToken(token).getSubject();
    }

    public String extractRole(String token) {
        Object role = parseToken(token).get("role");
        return role == null ? null : role.toString();
    }

    public String extractTokenFromAuthHeader(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        return authHeader.substring(7);
    }

    private Key getSignInKey() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private long parseExpiresInSeconds(String value) {
        if (value == null || value.isBlank()) {
            return 7 * 24 * 3600;
        }
        String trimmed = value.trim().toLowerCase();
        try {
            if (trimmed.endsWith("d")) {
                return Long.parseLong(trimmed.substring(0, trimmed.length() - 1)) * 24 * 3600;
            }
            if (trimmed.endsWith("h")) {
                return Long.parseLong(trimmed.substring(0, trimmed.length() - 1)) * 3600;
            }
            if (trimmed.endsWith("m")) {
                return Long.parseLong(trimmed.substring(0, trimmed.length() - 1)) * 60;
            }
            if (trimmed.endsWith("s")) {
                return Long.parseLong(trimmed.substring(0, trimmed.length() - 1));
            }
            return Long.parseLong(trimmed);
        } catch (NumberFormatException ex) {
            return 7 * 24 * 3600;
        }
    }
}
