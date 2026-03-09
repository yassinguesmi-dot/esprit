package tn.esprit.activities.api;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import tn.esprit.activities.security.JwtService;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
public class ReportsController extends BaseApiController {

    private final JdbcTemplate jdbcTemplate;
    private final JwtService jwtService;

    public ReportsController(JdbcTemplate jdbcTemplate, JwtService jwtService) {
        this.jdbcTemplate = jdbcTemplate;
        this.jwtService = jwtService;
    }

    @GetMapping
    public Map<String, Object> list(@RequestHeader(value = "Authorization", required = false) String authorization) {
        String userId = requireUserId(jwtService, authorization);
        List<Map<String, Object>> reports = jdbcTemplate.queryForList(
                "SELECT * FROM reports WHERE user_id = ?::uuid ORDER BY created_at DESC",
                userId
        );
        return Map.of("reports", reports);
    }

    @PostMapping("/generate")
    public ResponseEntity<byte[]> generate(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Map<String, Object> body
    ) {
        String userId = requireUserId(jwtService, authorization);
        String academicYear = body.get("academic_year") == null ? String.valueOf(Instant.now().getEpochSecond()) : body.get("academic_year").toString();

        int teachingCount = valueAsInt("SELECT COUNT(*) FROM teaching_activities WHERE user_id = ?::uuid AND academic_year = ?", userId, academicYear);
        int supervisionCount = valueAsInt("SELECT COUNT(*) FROM supervision_activities WHERE user_id = ?::uuid AND academic_year = ?", userId, academicYear);
        int researchCount = valueAsInt("SELECT COUNT(*) FROM research_publications WHERE user_id = ?::uuid", userId);

        String reportContent = "ESPRIT Activities Report\n" +
                "Academic Year: " + academicYear + "\n" +
                "Teaching activities: " + teachingCount + "\n" +
                "Supervision activities: " + supervisionCount + "\n" +
                "Research publications: " + researchCount + "\n";

        String reportId = jdbcTemplate.queryForObject(
                """
                INSERT INTO reports (id, user_id, report_type, academic_year, status, summary, created_at, updated_at)
                VALUES (?::uuid, ?::uuid, 'annual', ?, 'generated', ?::jsonb, NOW(), NOW())
                RETURNING id::text
                """,
                String.class,
                UUID.randomUUID().toString(),
                userId,
                academicYear,
                "{\"teaching\":" + teachingCount + ",\"supervision\":" + supervisionCount + ",\"research\":" + researchCount + "}"
        );

        byte[] bytes = reportContent.getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=report-" + reportId + ".txt")
                .contentType(MediaType.TEXT_PLAIN)
                .body(bytes);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> download(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable("id") String id
    ) {
        String userId = requireUserId(jwtService, authorization);
        Map<String, Object> report = jdbcTemplate.queryForMap("SELECT * FROM reports WHERE id = ?::uuid AND user_id = ?::uuid", id, userId);

        String content = "Report ID: " + report.get("id") + "\n" +
                "Type: " + report.get("report_type") + "\n" +
                "Academic year: " + report.get("academic_year") + "\n" +
                "Status: " + report.get("status") + "\n";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=report-" + id + ".txt")
                .contentType(MediaType.TEXT_PLAIN)
                .body(content.getBytes(StandardCharsets.UTF_8));
    }

    private int valueAsInt(String sql, Object... params) {
        Number value = jdbcTemplate.queryForObject(sql, Number.class, params);
        return value == null ? 0 : value.intValue();
    }
}
