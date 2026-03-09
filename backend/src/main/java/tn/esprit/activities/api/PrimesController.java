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
@RequestMapping("/api/primes")
public class PrimesController extends BaseApiController {

    private final JdbcTemplate jdbcTemplate;
    private final JwtService jwtService;

    public PrimesController(JdbcTemplate jdbcTemplate, JwtService jwtService) {
        this.jdbcTemplate = jdbcTemplate;
        this.jwtService = jwtService;
    }

    @GetMapping
    public Map<String, Object> list(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(value = "academic_year", required = false) String academicYear
    ) {
        String userId = requireUserId(jwtService, authorization);

        String sql = "SELECT * FROM primes WHERE user_id = ?::uuid " +
                ((academicYear != null && !academicYear.isBlank()) ? "AND academic_year = ? " : "") +
                "ORDER BY created_at DESC";

        List<Map<String, Object>> rows = (academicYear != null && !academicYear.isBlank())
                ? jdbcTemplate.queryForList(sql, userId, academicYear)
                : jdbcTemplate.queryForList(sql, userId);

        return Map.of("primes", rows);
    }
}
