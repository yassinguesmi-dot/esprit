package tn.esprit.activities.api;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import tn.esprit.activities.security.JwtService;

import java.util.*;

@RestController
@RequestMapping("/api/notifications")
public class NotificationsController extends BaseApiController {

    private final JdbcTemplate jdbcTemplate;
    private final JwtService jwtService;

    public NotificationsController(JdbcTemplate jdbcTemplate, JwtService jwtService) {
        this.jdbcTemplate = jdbcTemplate;
        this.jwtService = jwtService;
    }

    @GetMapping
    public Map<String, Object> getAll(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(value = "unread", required = false) Boolean unread
    ) {
        String userId = requireUserId(jwtService, authorization);

        String sql = "SELECT * FROM notifications WHERE user_id = ?::uuid " +
                (Boolean.TRUE.equals(unread) ? "AND is_read = false " : "") +
                "ORDER BY created_at DESC LIMIT 50";

        List<Map<String, Object>> notifications = jdbcTemplate.queryForList(sql, userId);
        Integer unreadCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM notifications WHERE user_id = ?::uuid AND is_read = false",
                Integer.class,
                userId
        );

        return Map.of(
                "notifications", notifications,
                "unread_count", unreadCount == null ? 0 : unreadCount
        );
    }

    @PutMapping
    public Map<String, Object> markRead(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Map<String, Object> body
    ) {
        String userId = requireUserId(jwtService, authorization);
        String notificationId = body.get("notificationId") == null ? null : body.get("notificationId").toString();
        Boolean read = body.get("read") == null ? Boolean.TRUE : Boolean.valueOf(body.get("read").toString());

        jdbcTemplate.update(
                "UPDATE notifications SET is_read = ?, read_at = NOW() WHERE id = ?::uuid AND user_id = ?::uuid",
                read,
                notificationId,
                userId
        );

        return Map.of("message", "Notification updated");
    }
}
