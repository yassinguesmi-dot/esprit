package tn.esprit.activities.api;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.activities.security.JwtService;

import java.util.*;

@RestController
@RequestMapping("/api/supervision")
public class SupervisionController extends BaseApiController {

    private final JdbcTemplate jdbcTemplate;
    private final JwtService jwtService;

    public SupervisionController(JdbcTemplate jdbcTemplate, JwtService jwtService) {
        this.jdbcTemplate = jdbcTemplate;
        this.jwtService = jwtService;
    }

    @GetMapping
    public Map<String, Object> getAll(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(value = "academic_year", required = false) String academicYear,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "status", required = false) String status
    ) {
        String userId = requireUserId(jwtService, authorization);

        StringBuilder sql = new StringBuilder("SELECT * FROM supervision_activities WHERE user_id = ?::uuid");
        List<Object> params = new ArrayList<>();
        params.add(userId);

        if (!isBlank(academicYear)) {
            sql.append(" AND academic_year = ?");
            params.add(academicYear);
        }
        if (!isBlank(type)) {
            sql.append(" AND supervision_type = ?");
            params.add(type);
        }
        if (!isBlank(status)) {
            sql.append(" AND status = ?");
            params.add(status);
        }

        sql.append(" ORDER BY created_at DESC");

        List<Map<String, Object>> supervisions = jdbcTemplate.queryForList(sql.toString(), params.toArray());
        return Map.of("supervisions", supervisions, "count", supervisions.size());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> create(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Map<String, Object> body
    ) {
        String userId = requireUserId(jwtService, authorization);

        String supervisionType = asString(body.get("supervision_type"));
        String title = asString(body.get("title"));
        String academicYear = asString(body.get("academic_year"));
        String startDate = asString(body.get("start_date"));
        String role = asString(body.get("role"));

        if (isBlank(supervisionType) || isBlank(title) || isBlank(academicYear) || isBlank(startDate) || isBlank(role)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing required fields");
        }

        String id = jdbcTemplate.queryForObject(
                """
                INSERT INTO supervision_activities (
                    user_id, student_id, supervision_type, title, description,
                    formation_id, academic_year, start_date, end_date, defense_date,
                    role, status, grade, remarks, documents, co_supervisor_id,
                    status_validation, created_at, updated_at
                ) VALUES (
                    ?::uuid, ?::uuid, ?, ?, ?,
                    ?::uuid, ?, ?::date, ?::date, ?::date,
                    ?, COALESCE(?, 'in_progress'), ?, ?, COALESCE(?::jsonb, '[]'::jsonb), ?::uuid,
                    'pending', NOW(), NOW()
                ) RETURNING id::text
                """,
                String.class,
                userId,
                asString(body.get("student_id")),
                supervisionType,
                title,
                asString(body.get("description")),
                asString(body.get("formation_id")),
                academicYear,
                startDate,
                asString(body.get("end_date")),
                asString(body.get("defense_date")),
                role,
                asString(body.get("status")),
                toDouble(body.get("grade")),
                asString(body.get("remarks")),
                asJsonArray(body.get("documents")),
                asString(body.get("co_supervisor_id"))
        );

        return jdbcTemplate.queryForMap("SELECT * FROM supervision_activities WHERE id = ?::uuid", id);
    }

    @PutMapping
    public Map<String, Object> update(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Map<String, Object> body
    ) {
        String userId = requireUserId(jwtService, authorization);
        String id = asString(body.get("id"));
        if (isBlank(id)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Supervision ID required");

        Map<String, Object> existing = jdbcTemplate.queryForMap("SELECT user_id::text as user_id, status_validation FROM supervision_activities WHERE id = ?::uuid", id);
        if (!userId.equals(asString(existing.get("user_id")))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized");
        }
        if ("validated".equals(asString(existing.get("status_validation")))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot modify validated supervision");
        }

        jdbcTemplate.update(
                """
                UPDATE supervision_activities
                SET student_id = COALESCE(?::uuid, student_id),
                    supervision_type = COALESCE(?, supervision_type),
                    title = COALESCE(?, title),
                    description = COALESCE(?, description),
                    formation_id = COALESCE(?::uuid, formation_id),
                    academic_year = COALESCE(?, academic_year),
                    start_date = COALESCE(?::date, start_date),
                    end_date = COALESCE(?::date, end_date),
                    defense_date = COALESCE(?::date, defense_date),
                    role = COALESCE(?, role),
                    status = COALESCE(?, status),
                    grade = COALESCE(?, grade),
                    remarks = COALESCE(?, remarks),
                    documents = COALESCE(?::jsonb, documents),
                    co_supervisor_id = COALESCE(?::uuid, co_supervisor_id),
                    updated_at = NOW()
                WHERE id = ?::uuid
                """,
                asString(body.get("student_id")),
                asString(body.get("supervision_type")),
                asString(body.get("title")),
                asString(body.get("description")),
                asString(body.get("formation_id")),
                asString(body.get("academic_year")),
                asString(body.get("start_date")),
                asString(body.get("end_date")),
                asString(body.get("defense_date")),
                asString(body.get("role")),
                asString(body.get("status")),
                toDouble(body.get("grade")),
                asString(body.get("remarks")),
                asJsonArray(body.get("documents")),
                asString(body.get("co_supervisor_id")),
                id
        );

        return jdbcTemplate.queryForMap("SELECT * FROM supervision_activities WHERE id = ?::uuid", id);
    }

    @DeleteMapping
    public Map<String, Object> delete(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam("id") String id
    ) {
        String userId = requireUserId(jwtService, authorization);
        Map<String, Object> existing = jdbcTemplate.queryForMap("SELECT user_id::text as user_id FROM supervision_activities WHERE id = ?::uuid", id);
        if (!userId.equals(asString(existing.get("user_id")))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized");
        }
        jdbcTemplate.update("DELETE FROM supervision_activities WHERE id = ?::uuid", id);
        return Map.of("message", "Supervision deleted successfully");
    }

    private static String asString(Object value) { return value == null ? null : value.toString(); }
    private static boolean isBlank(String value) { return value == null || value.trim().isEmpty(); }
    private static Double toDouble(Object value) {
        if (value == null) return null;
        if (value instanceof Number n) return n.doubleValue();
        return Double.parseDouble(value.toString());
    }
    private static String asJsonArray(Object value) {
        if (value == null) return null;
        if (value instanceof String s) return s;
        return "[]";
    }
}
