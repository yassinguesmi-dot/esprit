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
@RequestMapping("/api/admin")
public class AdminController extends BaseApiController {

    private final JdbcTemplate jdbcTemplate;
    private final JwtService jwtService;

    public AdminController(JdbcTemplate jdbcTemplate, JwtService jwtService) {
        this.jdbcTemplate = jdbcTemplate;
        this.jwtService = jwtService;
    }

    @GetMapping("/users")
    public Map<String, Object> users(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(value = "department_id", required = false) String departmentId,
            @RequestParam(value = "role", required = false) String role
    ) {
        requireAdmin(authorization);

        StringBuilder sql = new StringBuilder("""
                SELECT u.id as id,
                       u.email,
                       u.first_name,
                       u.last_name,
                       d.name as department_name,
                       r.name as role,
                       u.last_login,
                       u.is_active
                FROM users u
                LEFT JOIN departments d ON u.department_id = d.id
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE 1=1
                """);

        List<Object> params = new java.util.ArrayList<>();
        if (departmentId != null && !departmentId.isBlank()) {
            sql.append(" AND u.department_id = ?");
            params.add(departmentId);
        }
        if (role != null && !role.isBlank()) {
            sql.append(" AND r.name = ?");
            params.add(role);
        }
        sql.append(" ORDER BY u.created_at DESC");

        List<Map<String, Object>> users = jdbcTemplate.queryForList(sql.toString(), params.toArray());
        return Map.of("users", users);
    }

    @GetMapping("/departments/stats")
    public Map<String, Object> departmentStats(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        requireAdmin(authorization);

        List<Map<String, Object>> departments = jdbcTemplate.queryForList(
                """
            SELECT d.id as id,
                       d.name,
                       (SELECT COUNT(*) FROM users u WHERE u.department_id = d.id) as staff_count,
                       (SELECT COUNT(*) FROM teaching_activities ta JOIN users u ON ta.user_id = u.id WHERE u.department_id = d.id) as teaching_count,
                       (SELECT COUNT(*) FROM supervision_activities sa JOIN users u ON sa.user_id = u.id WHERE u.department_id = d.id) as supervision_count,
                       (SELECT COUNT(*) FROM research_publications rp JOIN users u ON rp.user_id = u.id WHERE u.department_id = d.id) as research_count
                FROM departments d
                ORDER BY d.name
                """
        );

        return Map.of("departments", departments);
    }

    private void requireAdmin(String authorization) {
        Claims claims = requireClaims(jwtService, authorization);
        String role = claims.get("role", String.class);
        if (!List.of("admin", "super_admin", "chef_departement").contains(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Insufficient permissions");
        }
    }
}
