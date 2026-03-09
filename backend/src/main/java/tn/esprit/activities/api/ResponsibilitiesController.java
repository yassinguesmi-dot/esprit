package tn.esprit.activities.api;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.activities.security.JwtService;

import java.util.*;

@RestController
@RequestMapping("/api/responsibilities")
public class ResponsibilitiesController extends BaseApiController {

    private final JdbcTemplate jdbcTemplate;
    private final JwtService jwtService;

    public ResponsibilitiesController(JdbcTemplate jdbcTemplate, JwtService jwtService) {
        this.jdbcTemplate = jdbcTemplate;
        this.jwtService = jwtService;
    }

    @GetMapping
    public Map<String, Object> getAll(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "status", required = false) String status
    ) {
        String userId = requireUserId(jwtService, authorization);

        StringBuilder sql = new StringBuilder("SELECT * FROM academic_responsibilities WHERE user_id = ?::uuid");
        List<Object> params = new ArrayList<>();
        params.add(userId);

        if (!isBlank(type)) {
            sql.append(" AND responsibility_type = ?");
            params.add(type);
        }
        if (!isBlank(status)) {
            sql.append(" AND status = ?");
            params.add(status);
        }

        sql.append(" ORDER BY start_date DESC, created_at DESC");

        List<Map<String, Object>> responsibilities = jdbcTemplate.queryForList(sql.toString(), params.toArray());
        double totalHours = responsibilities.stream().mapToDouble(r -> toDouble(r.get("hours_allocated"))).sum();

        return Map.of("responsibilities", responsibilities, "stats", Map.of("total", responsibilities.size(), "total_hours", totalHours));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> create(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Map<String, Object> body
    ) {
        String userId = requireUserId(jwtService, authorization);

        String responsibilityType = asString(body.get("responsibility_type"));
        String title = asString(body.get("title"));
        String startDate = asString(body.get("start_date"));

        if (isBlank(responsibilityType) || isBlank(title) || isBlank(startDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing required fields");
        }

        String id = jdbcTemplate.queryForObject(
                """
                INSERT INTO academic_responsibilities (
                    user_id, responsibility_type, title, description, department_id,
                    formation_id, module_id, start_date, end_date, hours_allocated,
                    status, created_at, updated_at
                ) VALUES (
                    ?::uuid, ?, ?, ?, ?::uuid,
                    ?::uuid, ?::uuid, ?::date, ?::date, ?,
                    COALESCE(?, 'active'), NOW(), NOW()
                ) RETURNING id::text
                """,
                String.class,
                userId,
                responsibilityType,
                title,
                asString(body.get("description")),
                asString(body.get("department_id")),
                asString(body.get("formation_id")),
                asString(body.get("module_id")),
                startDate,
                asString(body.get("end_date")),
                toInt(body.get("hours_allocated")),
                asString(body.get("status"))
        );

        return jdbcTemplate.queryForMap("SELECT * FROM academic_responsibilities WHERE id = ?::uuid", id);
    }

    @PutMapping
    public Map<String, Object> update(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Map<String, Object> body
    ) {
        String userId = requireUserId(jwtService, authorization);
        String id = asString(body.get("id"));
        if (isBlank(id)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Responsibility ID required");

        Map<String, Object> existing = jdbcTemplate.queryForMap("SELECT user_id::text as user_id, validated_by FROM academic_responsibilities WHERE id = ?::uuid", id);
        if (!userId.equals(asString(existing.get("user_id")))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized");
        }
        if (existing.get("validated_by") != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot modify validated responsibility");
        }

        jdbcTemplate.update(
                """
                UPDATE academic_responsibilities
                SET responsibility_type = COALESCE(?, responsibility_type),
                    title = COALESCE(?, title),
                    description = COALESCE(?, description),
                    department_id = COALESCE(?::uuid, department_id),
                    formation_id = COALESCE(?::uuid, formation_id),
                    module_id = COALESCE(?::uuid, module_id),
                    start_date = COALESCE(?::date, start_date),
                    end_date = COALESCE(?::date, end_date),
                    hours_allocated = COALESCE(?, hours_allocated),
                    status = COALESCE(?, status),
                    updated_at = NOW()
                WHERE id = ?::uuid
                """,
                asString(body.get("responsibility_type")),
                asString(body.get("title")),
                asString(body.get("description")),
                asString(body.get("department_id")),
                asString(body.get("formation_id")),
                asString(body.get("module_id")),
                asString(body.get("start_date")),
                asString(body.get("end_date")),
                toInt(body.get("hours_allocated")),
                asString(body.get("status")),
                id
        );

        return jdbcTemplate.queryForMap("SELECT * FROM academic_responsibilities WHERE id = ?::uuid", id);
    }

    @DeleteMapping
    public Map<String, Object> delete(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam("id") String id
    ) {
        String userId = requireUserId(jwtService, authorization);
        Map<String, Object> existing = jdbcTemplate.queryForMap("SELECT user_id::text as user_id FROM academic_responsibilities WHERE id = ?::uuid", id);
        if (!userId.equals(asString(existing.get("user_id")))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized");
        }
        jdbcTemplate.update("DELETE FROM academic_responsibilities WHERE id = ?::uuid", id);
        return Map.of("message", "Responsibility deleted successfully");
    }

    private static String asString(Object value) { return value == null ? null : value.toString(); }
    private static Integer toInt(Object value) {
        if (value == null) return null;
        if (value instanceof Number n) return n.intValue();
        return Integer.parseInt(value.toString());
    }
    private static double toDouble(Object value) {
        if (value == null) return 0;
        if (value instanceof Number n) return n.doubleValue();
        return Double.parseDouble(value.toString());
    }
    private static boolean isBlank(String value) { return value == null || value.trim().isEmpty(); }
}
