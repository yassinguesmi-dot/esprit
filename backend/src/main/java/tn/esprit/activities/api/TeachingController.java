package tn.esprit.activities.api;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.activities.security.JwtService;

import java.util.*;

@RestController
@RequestMapping("/api/teaching")
public class TeachingController extends BaseApiController {

    private final JdbcTemplate jdbcTemplate;
    private final JwtService jwtService;

    public TeachingController(JdbcTemplate jdbcTemplate, JwtService jwtService) {
        this.jdbcTemplate = jdbcTemplate;
        this.jwtService = jwtService;
    }

    @GetMapping
    public Map<String, Object> getAll(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(value = "academic_year", required = false) String academicYear,
            @RequestParam(value = "semester", required = false) Integer semester,
            @RequestParam(value = "status", required = false) String status
    ) {
        String userId = requireUserId(jwtService, authorization);

        StringBuilder sql = new StringBuilder("""
                SELECT ta.*, f.name as formation_name, c.name as class_name, m.name as module_name, m.code as module_code
                FROM teaching_activities ta
                LEFT JOIN formations f ON ta.formation_id = f.id
                LEFT JOIN classes c ON ta.class_id = c.id
                LEFT JOIN modules m ON ta.module_id = m.id
                WHERE ta.user_id = ?::uuid
                """);

        List<Object> params = new ArrayList<>();
        params.add(userId);

        if (academicYear != null && !academicYear.isBlank()) {
            sql.append(" AND ta.academic_year = ?");
            params.add(academicYear);
        }

        if (semester != null) {
            sql.append(" AND ta.semester = ?");
            params.add(semester);
        }

        if (status != null && !status.isBlank()) {
            sql.append(" AND ta.status = ?");
            params.add(status);
        }

        sql.append(" ORDER BY ta.created_at DESC");

        List<Map<String, Object>> activities = jdbcTemplate.queryForList(sql.toString(), params.toArray());

        double planned = activities.stream().mapToDouble(a -> toDouble(a.get("planned_hours"))).sum();
        double actual = activities.stream().mapToDouble(a -> toDouble(a.get("actual_hours"))).sum();

        return Map.of(
                "activities", activities,
                "totals", Map.of(
                        "planned_hours", planned,
                        "actual_hours", actual,
                        "count", activities.size()
                )
        );
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> create(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Map<String, Object> body
    ) {
        String userId = requireUserId(jwtService, authorization);

        String moduleId = asString(body.get("module_id"));
        Integer semester = toInt(body.get("semester"));
        String academicYear = asString(body.get("academic_year"));
        String teachingType = asString(body.get("teaching_type"));
        Integer plannedHours = toInt(body.get("planned_hours"));

        if (isBlank(moduleId) || semester == null || isBlank(academicYear) || isBlank(teachingType) || plannedHours == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing required fields");
        }

        String id = jdbcTemplate.queryForObject(
                """
                INSERT INTO teaching_activities (
                    user_id, formation_id, class_id, module_id, semester, academic_year,
                    teaching_type, teaching_language, planned_hours, actual_hours,
                    course_type, syllabus_url, comments, status, created_at, updated_at
                ) VALUES (
                    ?::uuid, ?::uuid, ?::uuid, ?::uuid, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?, ?, 'draft', NOW(), NOW()
                ) RETURNING id::text
                """,
                String.class,
                userId,
                asString(body.get("formation_id")),
                asString(body.get("class_id")),
                moduleId,
                semester,
                academicYear,
                teachingType,
                asString(body.get("teaching_language")),
                plannedHours,
                Optional.ofNullable(toInt(body.get("actual_hours"))).orElse(0),
                asString(body.get("course_type")),
                asString(body.get("syllabus_url")),
                asString(body.get("comments"))
        );

        return jdbcTemplate.queryForMap("SELECT * FROM teaching_activities WHERE id = ?::uuid", id);
    }

    @PutMapping
    public Map<String, Object> update(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Map<String, Object> body
    ) {
        String userId = requireUserId(jwtService, authorization);
        String id = asString(body.get("id"));

        if (isBlank(id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Activity ID required");
        }

        Map<String, Object> existing = jdbcTemplate.queryForMap("SELECT user_id::text as user_id, status FROM teaching_activities WHERE id = ?::uuid", id);
        if (!userId.equals(asString(existing.get("user_id")))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized");
        }
        if ("validated".equals(asString(existing.get("status")))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot modify validated activity");
        }

        jdbcTemplate.update(
                """
                UPDATE teaching_activities
                SET formation_id = COALESCE(?::uuid, formation_id),
                    class_id = COALESCE(?::uuid, class_id),
                    module_id = COALESCE(?::uuid, module_id),
                    semester = COALESCE(?, semester),
                    academic_year = COALESCE(?, academic_year),
                    teaching_type = COALESCE(?, teaching_type),
                    teaching_language = COALESCE(?, teaching_language),
                    planned_hours = COALESCE(?, planned_hours),
                    actual_hours = COALESCE(?, actual_hours),
                    course_type = COALESCE(?, course_type),
                    syllabus_url = COALESCE(?, syllabus_url),
                    comments = COALESCE(?, comments),
                    updated_at = NOW()
                WHERE id = ?::uuid
                """,
                asString(body.get("formation_id")),
                asString(body.get("class_id")),
                asString(body.get("module_id")),
                toInt(body.get("semester")),
                asString(body.get("academic_year")),
                asString(body.get("teaching_type")),
                asString(body.get("teaching_language")),
                toInt(body.get("planned_hours")),
                toInt(body.get("actual_hours")),
                asString(body.get("course_type")),
                asString(body.get("syllabus_url")),
                asString(body.get("comments")),
                id
        );

        return jdbcTemplate.queryForMap("SELECT * FROM teaching_activities WHERE id = ?::uuid", id);
    }

    private static String asString(Object value) {
        return value == null ? null : value.toString();
    }

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

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
