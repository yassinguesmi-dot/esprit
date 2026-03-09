package tn.esprit.activities.api;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.activities.security.JwtService;

import java.util.*;

@RestController
@RequestMapping("/api/research")
public class ResearchController extends BaseApiController {

    private final JdbcTemplate jdbcTemplate;
    private final JwtService jwtService;

    public ResearchController(JdbcTemplate jdbcTemplate, JwtService jwtService) {
        this.jdbcTemplate = jdbcTemplate;
        this.jwtService = jwtService;
    }

    @GetMapping
    public Map<String, Object> getAll(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "year", required = false) Integer year,
            @RequestParam(value = "indexation", required = false) String indexation
    ) {
        String userId = requireUserId(jwtService, authorization);

        StringBuilder sql = new StringBuilder("SELECT * FROM research_publications WHERE user_id = ?::uuid");
        List<Object> params = new ArrayList<>();
        params.add(userId);

        if (!isBlank(type)) {
            sql.append(" AND publication_type = ?");
            params.add(type);
        }
        if (year != null) {
            sql.append(" AND EXTRACT(YEAR FROM publication_date) = ?");
            params.add(year);
        }
        if (!isBlank(indexation)) {
            sql.append(" AND indexation = ?");
            params.add(indexation);
        }
        sql.append(" ORDER BY publication_date DESC, created_at DESC");

        List<Map<String, Object>> publications = jdbcTemplate.queryForList(sql.toString(), params.toArray());
        return Map.of("publications", publications, "count", publications.size());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> create(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Map<String, Object> body
    ) {
        String userId = requireUserId(jwtService, authorization);

        String publicationType = asString(body.get("publication_type"));
        String title = asString(body.get("title"));
        String authors = asString(body.get("authors"));
        String publicationDate = asString(body.get("publication_date"));

        if (isBlank(publicationType) || isBlank(title) || isBlank(authors) || isBlank(publicationDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing required fields");
        }

        String id = jdbcTemplate.queryForObject(
                """
                INSERT INTO research_publications (
                    user_id, publication_type, title, authors, publication_date,
                    journal_name, conference_name, publisher, volume, issue, pages,
                    doi, isbn, indexation, quartile, impact_factor, url, abstract,
                    keywords, status, attachment_url, created_at, updated_at
                ) VALUES (
                    ?::uuid, ?, ?, ?, ?::date,
                    ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?,
                    ?, COALESCE(?, 'published'), ?, NOW(), NOW()
                ) RETURNING id::text
                """,
                String.class,
                userId,
                publicationType,
                title,
                authors,
                publicationDate,
                asString(body.get("journal_name")),
                asString(body.get("conference_name")),
                asString(body.get("publisher")),
                asString(body.get("volume")),
                asString(body.get("issue")),
                asString(body.get("pages")),
                asString(body.get("doi")),
                asString(body.get("isbn")),
                asString(body.get("indexation")),
                asString(body.get("quartile")),
                toDouble(body.get("impact_factor")),
                asString(body.get("url")),
                asString(body.get("abstract")),
                asString(body.get("keywords")),
                asString(body.get("status")),
                asString(body.get("attachment_url"))
        );

        return jdbcTemplate.queryForMap("SELECT * FROM research_publications WHERE id = ?::uuid", id);
    }

    @PutMapping
    public Map<String, Object> update(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Map<String, Object> body
    ) {
        String userId = requireUserId(jwtService, authorization);
        String id = asString(body.get("id"));
        if (isBlank(id)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Publication ID required");

        Map<String, Object> existing = jdbcTemplate.queryForMap("SELECT user_id::text as user_id FROM research_publications WHERE id = ?::uuid", id);
        if (!userId.equals(asString(existing.get("user_id")))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized");
        }

        jdbcTemplate.update(
                """
                UPDATE research_publications
                SET publication_type = COALESCE(?, publication_type),
                    title = COALESCE(?, title),
                    authors = COALESCE(?, authors),
                    publication_date = COALESCE(?::date, publication_date),
                    journal_name = COALESCE(?, journal_name),
                    conference_name = COALESCE(?, conference_name),
                    publisher = COALESCE(?, publisher),
                    volume = COALESCE(?, volume),
                    issue = COALESCE(?, issue),
                    pages = COALESCE(?, pages),
                    doi = COALESCE(?, doi),
                    isbn = COALESCE(?, isbn),
                    indexation = COALESCE(?, indexation),
                    quartile = COALESCE(?, quartile),
                    impact_factor = COALESCE(?, impact_factor),
                    url = COALESCE(?, url),
                    abstract = COALESCE(?, abstract),
                    keywords = COALESCE(?, keywords),
                    status = COALESCE(?, status),
                    attachment_url = COALESCE(?, attachment_url),
                    updated_at = NOW()
                WHERE id = ?::uuid
                """,
                asString(body.get("publication_type")),
                asString(body.get("title")),
                asString(body.get("authors")),
                asString(body.get("publication_date")),
                asString(body.get("journal_name")),
                asString(body.get("conference_name")),
                asString(body.get("publisher")),
                asString(body.get("volume")),
                asString(body.get("issue")),
                asString(body.get("pages")),
                asString(body.get("doi")),
                asString(body.get("isbn")),
                asString(body.get("indexation")),
                asString(body.get("quartile")),
                toDouble(body.get("impact_factor")),
                asString(body.get("url")),
                asString(body.get("abstract")),
                asString(body.get("keywords")),
                asString(body.get("status")),
                asString(body.get("attachment_url")),
                id
        );

        return jdbcTemplate.queryForMap("SELECT * FROM research_publications WHERE id = ?::uuid", id);
    }

    @DeleteMapping
    public Map<String, Object> delete(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam("id") String id
    ) {
        String userId = requireUserId(jwtService, authorization);
        Map<String, Object> existing = jdbcTemplate.queryForMap("SELECT user_id::text as user_id FROM research_publications WHERE id = ?::uuid", id);
        if (!userId.equals(asString(existing.get("user_id")))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized");
        }
        jdbcTemplate.update("DELETE FROM research_publications WHERE id = ?::uuid", id);
        return Map.of("message", "Publication deleted successfully");
    }

    private static String asString(Object value) { return value == null ? null : value.toString(); }
    private static boolean isBlank(String value) { return value == null || value.trim().isEmpty(); }
    private static Double toDouble(Object value) {
        if (value == null) return null;
        if (value instanceof Number n) return n.doubleValue();
        return Double.parseDouble(value.toString());
    }
}
