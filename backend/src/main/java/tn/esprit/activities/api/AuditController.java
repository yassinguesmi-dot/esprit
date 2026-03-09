package tn.esprit.activities.api;

import io.jsonwebtoken.Claims;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.activities.security.JwtService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/audit")
public class AuditController extends BaseApiController {

    private final JdbcTemplate jdbcTemplate;
    private final JwtService jwtService;

    public AuditController(JdbcTemplate jdbcTemplate, JwtService jwtService) {
        this.jdbcTemplate = jdbcTemplate;
        this.jwtService = jwtService;
    }

    @GetMapping
    public Map<String, Object> list(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(value = "limit", required = false) Integer limit
    ) {
        Claims claims = requireClaims(jwtService, authorization);
        String role = claims.get("role", String.class);
        if (!List.of("admin", "super_admin").contains(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Insufficient permissions");
        }

        int max = (limit == null || limit <= 0 || limit > 500) ? 100 : limit;

        List<Map<String, Object>> logs = jdbcTemplate.queryForList(
                "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?",
                max
        );

        return Map.of("logs", logs, "count", logs.size());
    }
}
