package tn.esprit.activities.api;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.servlet.http.HttpServletRequest;
import tn.esprit.activities.dto.AuthLoginRequest;
import tn.esprit.activities.dto.AuthRegisterRequest;
import tn.esprit.activities.security.JwtService;
import tn.esprit.activities.security.LoginAttemptService;
import jakarta.validation.Valid;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@Validated
public class AuthController {

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LoginAttemptService loginAttemptService;

    public AuthController(JdbcTemplate jdbcTemplate, PasswordEncoder passwordEncoder, JwtService jwtService, LoginAttemptService loginAttemptService) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.loginAttemptService = loginAttemptService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> register(@Valid @RequestBody AuthRegisterRequest body) {
        String email = body.getEmail();
        String password = body.getPassword();
        String nom = body.getNom();
        String prenom = body.getPrenom();
        String role = body.getRole();

        Integer existing = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE email = ?",
                Integer.class,
                email
        );

        if (existing != null && existing > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User already exists");
        }

        String roleId;
        try {
            roleId = jdbcTemplate.queryForObject(
                "SELECT id FROM roles WHERE name = ?",
                    String.class,
                    role
            );
        } catch (EmptyResultDataAccessException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid role");
        }

        String userId = UUID.randomUUID().toString();
        jdbcTemplate.update(
            """
            INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
            """,
            userId,
                email,
                passwordEncoder.encode(password),
                prenom,
                nom,
                roleId
        );

        String token = jwtService.generateToken(userId, email, role);

        return Map.of(
                "message", "User created successfully",
                "token", token,
                "user", Map.of(
                        "id", userId,
                        "email", email,
                        "nom", nom,
                        "prenom", prenom,
                        "role", role
                )
        );
    }

    @PostMapping("/login")
    public Map<String, Object> login(@Valid @RequestBody AuthLoginRequest body, HttpServletRequest request) {
        String email = body.getEmail();
        String password = body.getPassword();
        String attemptKey = email.toLowerCase() + "|" + clientIp(request);

        if (loginAttemptService.isBlocked(attemptKey)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Too many failed attempts. Retry in " + loginAttemptService.remainingSeconds(attemptKey) + " seconds");
        }

        Map<String, Object> user;
        try {
            user = jdbcTemplate.queryForMap(
                    """
                    SELECT u.id as id,
                           u.email,
                           u.password_hash,
                           u.first_name,
                           u.last_name,
                           r.name as role
                    FROM users u
                    INNER JOIN roles r ON u.role_id = r.id
                    WHERE u.email = ?
                    """,
                    email
            );
        } catch (EmptyResultDataAccessException ex) {
            loginAttemptService.onFailure(attemptKey);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        String passwordHash = asString(user.get("password_hash"));
        if (!passwordEncoder.matches(password, passwordHash)) {
            loginAttemptService.onFailure(attemptKey);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        loginAttemptService.onSuccess(attemptKey);

        String userId = asString(user.get("id"));
        String role = asString(user.get("role"));

        String token = jwtService.generateToken(userId, email, role);

    jdbcTemplate.update("UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = ?", userId);

        return Map.of(
                "message", "Login successful",
                "token", token,
                "user", Map.of(
                        "id", userId,
                        "email", email,
                        "nom", asString(user.get("last_name")),
                        "prenom", asString(user.get("first_name")),
                        "role", role
                )
        );
    }

    private static String asString(Object value) {
        return value == null ? null : value.toString();
    }

    private static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
