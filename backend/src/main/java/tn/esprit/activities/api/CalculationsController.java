package tn.esprit.activities.api;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import tn.esprit.activities.dto.CalculationRequest;
import tn.esprit.activities.security.JwtService;
import jakarta.validation.Valid;

import java.util.*;

@RestController
@RequestMapping("/api/calculations")
@Validated
public class CalculationsController extends BaseApiController {

    private final JdbcTemplate jdbcTemplate;
    private final JwtService jwtService;

    public CalculationsController(JdbcTemplate jdbcTemplate, JwtService jwtService) {
        this.jdbcTemplate = jdbcTemplate;
        this.jwtService = jwtService;
    }

    @PostMapping
    public Map<String, Object> calculate(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody CalculationRequest body
    ) {
        String requesterId = requireUserId(jwtService, authorization);
        String academicYear = body.getAcademic_year();
        String targetUserId = (body.getUser_id() == null || body.getUser_id().isBlank()) ? requesterId : body.getUser_id();

        double teachingHours = valueAsDouble("SELECT COALESCE(SUM(actual_hours),0) FROM teaching_activities WHERE user_id = ? AND academic_year = ?", targetUserId, academicYear);
        double examHours = valueAsDouble("SELECT COALESCE(SUM(hours),0) FROM exam_supervisions WHERE user_id = ? AND academic_year = ?", targetUserId, academicYear);
        int supervisionCount = valueAsInt("SELECT COUNT(*) FROM supervision_activities WHERE user_id = ? AND academic_year = ?", targetUserId, academicYear);
        int researchCount = valueAsInt("SELECT COUNT(*) FROM research_publications WHERE user_id = ? AND YEAR(publication_date) = ?", targetUserId, parseAcademicYear(academicYear));
        int responsibilitiesCount = valueAsInt("SELECT COUNT(*) FROM academic_responsibilities WHERE user_id = ?", targetUserId);

        double totalScore = teachingHours + (examHours * 0.5) + (supervisionCount * 10) + (researchCount * 50) + (responsibilitiesCount * 20);
        double bonusAmount = Math.round((totalScore * 10.0) * 100.0) / 100.0;

        upsertPerformanceIndicators(targetUserId, academicYear, teachingHours, supervisionCount, researchCount, responsibilitiesCount, totalScore);
        upsertPrime(targetUserId, academicYear, bonusAmount, totalScore);

        return Map.of(
                "metrics", Map.of(
                        "teaching_hours", teachingHours,
                        "exam_hours", examHours,
                        "supervision_count", supervisionCount,
                        "research_count", researchCount,
                        "responsibilities_count", responsibilitiesCount,
                        "total_score", totalScore
                ),
                "bonus_amount", bonusAmount,
                "calculated_at", new Date().toString()
        );
    }

    @GetMapping
    public Map<String, Object> getPrimes(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(value = "user_id", required = false) String userId,
            @RequestParam(value = "academic_year", required = false) String academicYear
    ) {
        String requesterId = requireUserId(jwtService, authorization);
        String targetUserId = (userId == null || userId.isBlank()) ? requesterId : userId;

        String sql = "SELECT * FROM primes WHERE user_id = ? " + (academicYear != null && !academicYear.isBlank() ? "AND academic_year = ? " : "") + "ORDER BY created_at DESC";
        List<Map<String, Object>> primes = academicYear != null && !academicYear.isBlank()
                ? jdbcTemplate.queryForList(sql, targetUserId, academicYear)
                : jdbcTemplate.queryForList(sql, targetUserId);

        return Map.of("primes", primes);
    }

    private void upsertPerformanceIndicators(String userId, String academicYear, double teachingHours, int supervision, int research, int responsibilities, double totalScore) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM performance_indicators WHERE user_id = ? AND academic_year = ?",
                Integer.class,
                userId,
                academicYear
        );

        if (count != null && count > 0) {
            jdbcTemplate.update(
                    """
                    UPDATE performance_indicators
                    SET teaching_hours = ?, supervision_hours = ?, research_count = ?, conference_count = 0,
                        responsibilities_count = ?, total_score = ?, updated_at = NOW()
                    WHERE user_id = ? AND academic_year = ?
                    """,
                    (int) Math.round(teachingHours), supervision, research, responsibilities, totalScore, userId, academicYear
            );
        } else {
            jdbcTemplate.update(
                    """
                    INSERT INTO performance_indicators (user_id, academic_year, teaching_hours, supervision_hours, research_count, conference_count, responsibilities_count, total_score, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, 0, ?, ?, NOW(), NOW())
                    """,
                    userId, academicYear, (int) Math.round(teachingHours), supervision, research, responsibilities, totalScore
            );
        }
    }

    private void upsertPrime(String userId, String academicYear, double amount, double totalScore) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM primes WHERE user_id = ? AND academic_year = ?",
                Integer.class,
                userId,
                academicYear
        );

        String details = "{\"total_score\":" + totalScore + "}";

        if (count != null && count > 0) {
            jdbcTemplate.update(
                    "UPDATE primes SET total_amount = ?, calculation_details = ?, status = 'calculated', updated_at = NOW() WHERE user_id = ? AND academic_year = ?",
                    amount,
                    details,
                    userId,
                    academicYear
            );
        } else {
            jdbcTemplate.update(
                    "INSERT INTO primes (user_id, academic_year, total_amount, calculation_details, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'calculated', NOW(), NOW())",
                    userId,
                    academicYear,
                    amount,
                    details
            );
        }
    }

    private double valueAsDouble(String sql, Object... params) {
        Number value = jdbcTemplate.queryForObject(sql, Number.class, params);
        return value == null ? 0 : value.doubleValue();
    }

    private int valueAsInt(String sql, Object... params) {
        Number value = jdbcTemplate.queryForObject(sql, Number.class, params);
        return value == null ? 0 : value.intValue();
    }

    private static String asString(Object value) {
        return value == null ? null : value.toString();
    }

    private static int parseAcademicYear(String academicYear) {
        if (academicYear == null || academicYear.isBlank()) {
            return Calendar.getInstance().get(Calendar.YEAR);
        }
        String[] parts = academicYear.split("-");
        return Integer.parseInt(parts[0]);
    }
}
