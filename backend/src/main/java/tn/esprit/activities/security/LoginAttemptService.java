package tn.esprit.activities.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LoginAttemptService {

    private final Map<String, Integer> attempts = new ConcurrentHashMap<>();
    private final Map<String, Instant> lockUntil = new ConcurrentHashMap<>();

    @Value("${app.security.login.max-attempts:5}")
    private int maxAttempts;

    @Value("${app.security.login.lock-minutes:15}")
    private int lockMinutes;

    public boolean isBlocked(String key) {
        Instant until = lockUntil.get(key);
        if (until == null) {
            return false;
        }
        if (Instant.now().isAfter(until)) {
            lockUntil.remove(key);
            attempts.remove(key);
            return false;
        }
        return true;
    }

    public long remainingSeconds(String key) {
        Instant until = lockUntil.get(key);
        if (until == null) {
            return 0;
        }
        return Math.max(0, until.getEpochSecond() - Instant.now().getEpochSecond());
    }

    public void onSuccess(String key) {
        attempts.remove(key);
        lockUntil.remove(key);
    }

    public void onFailure(String key) {
        int count = attempts.getOrDefault(key, 0) + 1;
        attempts.put(key, count);
        if (count >= maxAttempts) {
            lockUntil.put(key, Instant.now().plusSeconds((long) lockMinutes * 60));
        }
    }
}
