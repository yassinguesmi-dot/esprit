package tn.esprit.activities.api;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.activities.security.JwtService;

import java.util.*;

@RestController
@RequestMapping("/api/workflow")
public class WorkflowController extends BaseApiController {

    private final JdbcTemplate jdbcTemplate;
    private final JwtService jwtService;

    private static final Map<String, String> TABLES = Map.of(
            "teaching", "teaching_activities",
            "supervision", "supervision_activities",
            "research", "research_publications",
            "exam", "exam_supervisions",
            "responsibility", "academic_responsibilities"
    );

    public WorkflowController(JdbcTemplate jdbcTemplate, JwtService jwtService) {
        this.jdbcTemplate = jdbcTemplate;
        this.jwtService = jwtService;
    }

    @PostMapping
    public Map<String, Object> action(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Map<String, Object> body
    ) {
        String userId = requireUserId(jwtService, authorization);

        String activityType = asString(body.get("activity_type"));
        String activityId = asString(body.get("activity_id"));
        String action = asString(body.get("action"));
        String comments = asString(body.get("comments"));

        if (isBlank(activityType) || isBlank(activityId) || isBlank(action)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing required fields");
        }

        String table = TABLES.get(activityType);
        if (table == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid activity type");
        }

        Map<String, Object> currentUser = jdbcTemplate.queryForMap(
                "SELECT u.id::text as id, r.name as role FROM users u INNER JOIN roles r ON u.role_id = r.id WHERE u.id = ?::uuid",
                userId
        );

        String role = asString(currentUser.get("role"));

        switch (action) {
            case "submit" -> handleSubmit(table, activityType, activityId, userId, comments);
            case "validate" -> handleValidate(table, activityType, activityId, userId, role, comments);
            case "reject" -> handleReject(table, activityType, activityId, userId, role, comments);
            case "request_revision" -> handleRevision(table, activityType, activityId, userId, role, comments);
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid action");
        }

        return Map.of("success", true, "message", "Workflow action applied", "action", action);
    }

    @GetMapping
    public Map<String, Object> history(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam("activity_type") String activityType,
            @RequestParam("activity_id") String activityId
    ) {
        requireUserId(jwtService, authorization);

        List<Map<String, Object>> history = jdbcTemplate.queryForList(
                """
                SELECT ac.id,
                       ac.activity_type,
                       ac.activity_id::text as activity_id,
                       ac.user_id::text as user_id,
                       ac.comment,
                       ac.comment_type,
                       ac.created_at,
                       u.first_name,
                       u.last_name
                FROM activity_comments ac
                LEFT JOIN users u ON ac.user_id = u.id
                WHERE ac.activity_type = ? AND ac.activity_id = ?::uuid
                ORDER BY ac.created_at DESC
                """,
                activityType,
                activityId
        );

        return Map.of("validations", history);
    }

    private void handleSubmit(String table, String activityType, String activityId, String userId, String comments) {
        Map<String, Object> activity = jdbcTemplate.queryForMap(
                "SELECT user_id::text as user_id, status FROM " + table + " WHERE id = ?::uuid",
                activityId
        );

        if (!userId.equals(asString(activity.get("user_id")))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized");
        }

        jdbcTemplate.update("UPDATE " + table + " SET status = 'pending', updated_at = NOW() WHERE id = ?::uuid", activityId);

        insertHistory(activityType, activityId, userId, comments, "submitted");
    }

    private void handleValidate(String table, String activityType, String activityId, String validatorId, String role, String comments) {
        ensureValidatorRole(role);

        Map<String, Object> activity = jdbcTemplate.queryForMap(
                "SELECT user_id::text as user_id FROM " + table + " WHERE id = ?::uuid",
                activityId
        );

        jdbcTemplate.update(
                "UPDATE " + table + " SET status = 'validated', validated_by = ?::uuid, validation_date = NOW(), updated_at = NOW() WHERE id = ?::uuid",
                validatorId,
                activityId
        );

        insertHistory(activityType, activityId, validatorId, comments, "approved");
        notifyOwner(asString(activity.get("user_id")), "activity_validated", "Activité validée", "Votre activité a été validée.", activityType, activityId);
    }

    private void handleReject(String table, String activityType, String activityId, String validatorId, String role, String comments) {
        ensureValidatorRole(role);

        Map<String, Object> activity = jdbcTemplate.queryForMap(
                "SELECT user_id::text as user_id FROM " + table + " WHERE id = ?::uuid",
                activityId
        );

        jdbcTemplate.update(
                "UPDATE " + table + " SET status = 'rejected', validated_by = ?::uuid, validation_date = NOW(), updated_at = NOW() WHERE id = ?::uuid",
                validatorId,
                activityId
        );

        insertHistory(activityType, activityId, validatorId, comments, "rejected");
        notifyOwner(asString(activity.get("user_id")), "activity_rejected", "Activité rejetée", "Votre activité a été rejetée.", activityType, activityId);
    }

    private void handleRevision(String table, String activityType, String activityId, String validatorId, String role, String comments) {
        ensureValidatorRole(role);

        Map<String, Object> activity = jdbcTemplate.queryForMap(
                "SELECT user_id::text as user_id FROM " + table + " WHERE id = ?::uuid",
                activityId
        );

        jdbcTemplate.update(
                "UPDATE " + table + " SET status = 'draft', updated_at = NOW() WHERE id = ?::uuid",
                activityId
        );

        insertHistory(activityType, activityId, validatorId, comments, "revision_requested");
        notifyOwner(asString(activity.get("user_id")), "activity_revision_requested", "Révision demandée", "Une révision est demandée pour votre activité.", activityType, activityId);
    }

    private void insertHistory(String activityType, String activityId, String userId, String comments, String commentType) {
        jdbcTemplate.update(
                """
                INSERT INTO activity_comments (activity_type, activity_id, user_id, comment, comment_type, created_at)
                VALUES (?, ?::uuid, ?::uuid, ?, ?, NOW())
                """,
                activityType,
                activityId,
                userId,
                comments == null ? "" : comments,
                commentType
        );
    }

    private void notifyOwner(String userId, String type, String title, String message, String relatedType, String relatedId) {
        jdbcTemplate.update(
                """
                INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id, is_read, created_at)
                VALUES (?::uuid, ?, ?, ?, ?, ?::uuid, false, NOW())
                """,
                userId,
                type,
                title,
                message,
                relatedType,
                relatedId
        );
    }

    private void ensureValidatorRole(String role) {
        if (!List.of("chef_departement", "admin", "super_admin").contains(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Insufficient permissions");
        }
    }

    private static String asString(Object value) { return value == null ? null : value.toString(); }
    private static boolean isBlank(String value) { return value == null || value.trim().isEmpty(); }
}
