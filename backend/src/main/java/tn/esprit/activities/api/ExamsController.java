package tn.esprit.activities.api;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.activities.security.JwtService;

import java.util.*;

@RestController
@RequestMapping("/api/exams")
public class ExamsController extends BaseApiController {

    private final JdbcTemplate jdbcTemplate;
    private final JwtService jwtService;

    public ExamsController(JdbcTemplate jdbcTemplate, JwtService jwtService) {
        this.jdbcTemplate = jdbcTemplate;
        this.jwtService = jwtService;
    }

    @GetMapping
    public Map<String, Object> getAll(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(value = "academic_year", required = false) String academicYear,
            @RequestParam(value = "semester", required = false) Integer semester,
            @RequestParam(value = "session", required = false) String session
    ) {
        String userId = requireUserId(jwtService, authorization);

        StringBuilder sql = new StringBuilder("SELECT * FROM exam_supervisions WHERE user_id = ?::uuid");
        List<Object> params = new ArrayList<>();
        params.add(userId);

        if (academicYear != null && !academicYear.isBlank()) {
            sql.append(" AND academic_year = ?");
            params.add(academicYear);
        }
        if (semester != null) {
            sql.append(" AND semester = ?");
            params.add(semester);
        }
        if (session != null && !session.isBlank()) {
            sql.append(" AND session = ?");
            params.add(session);
        }

        sql.append(" ORDER BY exam_date DESC, created_at DESC");

        List<Map<String, Object>> supervisions = jdbcTemplate.queryForList(sql.toString(), params.toArray());
        double totalHours = supervisions.stream().mapToDouble(s -> toDouble(s.get("hours"))).sum();

        return Map.of(
                "supervisions", supervisions,
                "totals", Map.of("total_hours", totalHours, "total_count", supervisions.size())
        );
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> create(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Map<String, Object> body
    ) {
        String userId = requireUserId(jwtService, authorization);

        String examType = asString(body.get("exam_type"));
        String examDate = asString(body.get("exam_date"));
        String session = asString(body.get("session"));
        String academicYear = asString(body.get("academic_year"));
        Integer hours = toInt(body.get("hours"));

        if (isBlank(examType) || isBlank(examDate) || isBlank(session) || isBlank(academicYear) || hours == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing required fields");
        }

        String id = jdbcTemplate.queryForObject(
                """
                INSERT INTO exam_supervisions (
                    user_id, module_id, exam_type, exam_date, start_time, end_time,
                    session, semester, academic_year, class_id, room, students_count,
                    hours, comments, status, created_at, updated_at
                ) VALUES (
                    ?::uuid, ?::uuid, ?, ?::date, ?::time, ?::time,
                    ?, ?, ?, ?::uuid, ?, ?,
                    ?, ?, COALESCE(?, 'scheduled'), NOW(), NOW()
                ) RETURNING id::text
                """,
                String.class,
                userId,
                asString(body.get("module_id")),
                examType,
                examDate,
                asString(body.get("start_time")),
                asString(body.get("end_time")),
                session,
                toInt(body.get("semester")),
                academicYear,
                asString(body.get("class_id")),
                asString(body.get("room")),
                toInt(body.get("students_count")),
                hours,
                asString(body.get("comments")),
                asString(body.get("status"))
        );

        return jdbcTemplate.queryForMap("SELECT * FROM exam_supervisions WHERE id = ?::uuid", id);
    }

    @PutMapping
    public Map<String, Object> update(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Map<String, Object> body
    ) {
        String userId = requireUserId(jwtService, authorization);
        String id = asString(body.get("id"));
        if (isBlank(id)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Supervision ID required");

        Map<String, Object> existing = jdbcTemplate.queryForMap("SELECT user_id::text as user_id FROM exam_supervisions WHERE id = ?::uuid", id);
        if (!userId.equals(asString(existing.get("user_id")))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized");
        }

        jdbcTemplate.update(
                """
                UPDATE exam_supervisions
                SET module_id = COALESCE(?::uuid, module_id),
                    exam_type = COALESCE(?, exam_type),
                    exam_date = COALESCE(?::date, exam_date),
                    start_time = COALESCE(?::time, start_time),
                    end_time = COALESCE(?::time, end_time),
                    session = COALESCE(?, session),
                    semester = COALESCE(?, semester),
                    academic_year = COALESCE(?, academic_year),
                    class_id = COALESCE(?::uuid, class_id),
                    room = COALESCE(?, room),
                    students_count = COALESCE(?, students_count),
                    hours = COALESCE(?, hours),
                    comments = COALESCE(?, comments),
                    status = COALESCE(?, status),
                    updated_at = NOW()
                WHERE id = ?::uuid
                """,
                asString(body.get("module_id")),
                asString(body.get("exam_type")),
                asString(body.get("exam_date")),
                asString(body.get("start_time")),
                asString(body.get("end_time")),
                asString(body.get("session")),
                toInt(body.get("semester")),
                asString(body.get("academic_year")),
                asString(body.get("class_id")),
                asString(body.get("room")),
                toInt(body.get("students_count")),
                toInt(body.get("hours")),
                asString(body.get("comments")),
                asString(body.get("status")),
                id
        );

        return jdbcTemplate.queryForMap("SELECT * FROM exam_supervisions WHERE id = ?::uuid", id);
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
