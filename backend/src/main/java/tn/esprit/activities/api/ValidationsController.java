package tn.esprit.activities.api;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tn.esprit.activities.security.JwtService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/validations")
public class ValidationsController extends BaseApiController {

    private final JdbcTemplate jdbcTemplate;
    private final JwtService jwtService;

    public ValidationsController(JdbcTemplate jdbcTemplate, JwtService jwtService) {
        this.jdbcTemplate = jdbcTemplate;
        this.jwtService = jwtService;
    }

    @GetMapping
    public Map<String, Object> list(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(value = "activity_id", required = false) String activityId
    ) {
        requireUserId(jwtService, authorization);

        String sql = """
                SELECT v.id,
                       v.activity_id::text as activity_id,
                       v.validator_id::text as validator_id,
                       v.decision,
                       v.comments,
                       v.validation_date,
                       ws.name as workflow_state,
                       u.first_name,
                       u.last_name
                FROM validations v
                LEFT JOIN workflow_states ws ON v.workflow_state_id = ws.id
                LEFT JOIN users u ON v.validator_id = u.id
                """ + ((activityId != null && !activityId.isBlank()) ? "WHERE v.activity_id = ?::uuid " : "") +
                "ORDER BY v.created_at DESC";

        List<Map<String, Object>> rows = (activityId != null && !activityId.isBlank())
                ? jdbcTemplate.queryForList(sql, activityId)
                : jdbcTemplate.queryForList(sql);

        return Map.of("validations", rows);
    }
}
