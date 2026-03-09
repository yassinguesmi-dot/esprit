package tn.esprit.activities.api;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.esprit.activities.security.JwtService;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController extends BaseApiController {

    private final JdbcTemplate jdbcTemplate;
    private final JwtService jwtService;

    public AnalyticsController(JdbcTemplate jdbcTemplate, JwtService jwtService) {
        this.jdbcTemplate = jdbcTemplate;
        this.jwtService = jwtService;
    }

    @GetMapping
    public Map<String, Object> get(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        requireUserId(jwtService, authorization);

        int users = valueAsInt("SELECT COUNT(*) FROM users");
        int teaching = valueAsInt("SELECT COUNT(*) FROM teaching_activities");
        int supervision = valueAsInt("SELECT COUNT(*) FROM supervision_activities");
        int research = valueAsInt("SELECT COUNT(*) FROM research_publications");
        int exams = valueAsInt("SELECT COUNT(*) FROM exam_supervisions");
        int responsibilities = valueAsInt("SELECT COUNT(*) FROM academic_responsibilities");

        return Map.of(
                "users", Map.of("total", users),
                "activities", Map.of(
                        "teaching", teaching,
                        "supervision", supervision,
                        "research", research,
                        "exams", exams,
                        "responsibilities", responsibilities
                )
        );
    }

    private int valueAsInt(String sql) {
        Number value = jdbcTemplate.queryForObject(sql, Number.class);
        return value == null ? 0 : value.intValue();
    }
}
