package tn.esprit.activities.api;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.activities.security.JwtService;

import java.util.*;

@RestController
@RequestMapping("/api/activities")
public class ActivitiesController extends BaseApiController {

    private final JdbcTemplate jdbcTemplate;
    private final JwtService jwtService;

    public ActivitiesController(JdbcTemplate jdbcTemplate, JwtService jwtService) {
        this.jdbcTemplate = jdbcTemplate;
        this.jwtService = jwtService;
    }

    @GetMapping
    public Map<String, Object> list(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(value = "status", required = false) String status
    ) {
        String userId = requireUserId(jwtService, authorization);
        String sql = "SELECT * FROM activities WHERE user_id = ?::uuid " +
                ((status != null && !status.isBlank()) ? "AND status = ? " : "") +
                "ORDER BY created_at DESC";

        List<Map<String, Object>> activities = (status != null && !status.isBlank())
                ? jdbcTemplate.queryForList(sql, userId, status)
                : jdbcTemplate.queryForList(sql, userId);

        return Map.of("activities", activities, "count", activities.size());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> create(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Map<String, Object> body
    ) {
        String userId = requireUserId(jwtService, authorization);

        String activityTypeId = asString(body.get("activity_type_id"));
        String title = asString(body.get("title"));
        String startDate = asString(body.get("start_date"));

        if (isBlank(activityTypeId) || isBlank(title) || isBlank(startDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing required fields");
        }

        String id = jdbcTemplate.queryForObject(
                """
                INSERT INTO activities (user_id, activity_type_id, title, description, start_date, end_date, hours_declared, status, metadata, created_at, updated_at)
                VALUES (?::uuid, ?::uuid, ?, ?, ?::date, ?::date, ?, COALESCE(?, 'draft'), COALESCE(?::jsonb, '{}'::jsonb), NOW(), NOW())
                RETURNING id::text
                """,
                String.class,
                userId,
                activityTypeId,
                title,
                asString(body.get("description")),
                startDate,
                asString(body.get("end_date")),
                toInt(body.get("hours_declared")),
                asString(body.get("status")),
                asString(body.get("metadata"))
        );

        return jdbcTemplate.queryForMap("SELECT * FROM activities WHERE id = ?::uuid", id);
    }

    @GetMapping("/{id}")
    public Map<String, Object> byId(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable("id") String id
    ) {
        String userId = requireUserId(jwtService, authorization);
        Map<String, Object> activity = jdbcTemplate.queryForMap("SELECT * FROM activities WHERE id = ?::uuid", id);
        if (!userId.equals(asString(activity.get("user_id")))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized");
        }
        return activity;
    }

    @PutMapping("/{id}")
    public Map<String, Object> update(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable("id") String id,
            @RequestBody Map<String, Object> body
    ) {
        String userId = requireUserId(jwtService, authorization);
        Map<String, Object> existing = jdbcTemplate.queryForMap("SELECT user_id::text as user_id, status FROM activities WHERE id = ?::uuid", id);
        if (!userId.equals(asString(existing.get("user_id")))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized");
        }

        jdbcTemplate.update(
                """
                UPDATE activities
                SET title = COALESCE(?, title),
                    description = COALESCE(?, description),
                    start_date = COALESCE(?::date, start_date),
                    end_date = COALESCE(?::date, end_date),
                    hours_declared = COALESCE(?, hours_declared),
                    status = COALESCE(?, status),
                    metadata = COALESCE(?::jsonb, metadata),
                    updated_at = NOW()
                WHERE id = ?::uuid
                """,
                asString(body.get("title")),
                asString(body.get("description")),
                asString(body.get("start_date")),
                asString(body.get("end_date")),
                toInt(body.get("hours_declared")),
                asString(body.get("status")),
                asString(body.get("metadata")),
                id
        );

        return jdbcTemplate.queryForMap("SELECT * FROM activities WHERE id = ?::uuid", id);
    }

    private static String asString(Object value) { return value == null ? null : value.toString(); }
    private static Integer toInt(Object value) {
        if (value == null) return null;
        if (value instanceof Number n) return n.intValue();
        return Integer.parseInt(value.toString());
    }
    private static boolean isBlank(String value) { return value == null || value.trim().isEmpty(); }
}
