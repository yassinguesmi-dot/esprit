package tn.esprit.activities.api;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import tn.esprit.activities.security.JwtService;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/export")
public class ExportController extends BaseApiController {

    private final JdbcTemplate jdbcTemplate;
    private final JwtService jwtService;

    public ExportController(JdbcTemplate jdbcTemplate, JwtService jwtService) {
        this.jdbcTemplate = jdbcTemplate;
        this.jwtService = jwtService;
    }

    @GetMapping("/excel")
    public ResponseEntity<byte[]> exportExcel(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(value = "academic_year", required = false) String academicYear
    ) {
        String userId = requireUserId(jwtService, authorization);

        String sql = "SELECT id, academic_year, semester, teaching_type, planned_hours, actual_hours, status FROM teaching_activities WHERE user_id = ? " +
                ((academicYear != null && !academicYear.isBlank()) ? "AND academic_year = ? " : "") +
                "ORDER BY created_at DESC";

        List<Map<String, Object>> rows = (academicYear != null && !academicYear.isBlank())
                ? jdbcTemplate.queryForList(sql, userId, academicYear)
                : jdbcTemplate.queryForList(sql, userId);

        byte[] content;
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Teaching");

            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("id");
            header.createCell(1).setCellValue("academic_year");
            header.createCell(2).setCellValue("semester");
            header.createCell(3).setCellValue("teaching_type");
            header.createCell(4).setCellValue("planned_hours");
            header.createCell(5).setCellValue("actual_hours");
            header.createCell(6).setCellValue("status");

            int rowIndex = 1;
            for (Map<String, Object> rowData : rows) {
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue(safe(rowData.get("id")));
                row.createCell(1).setCellValue(safe(rowData.get("academic_year")));
                row.createCell(2).setCellValue(safe(rowData.get("semester")));
                row.createCell(3).setCellValue(safe(rowData.get("teaching_type")));
                row.createCell(4).setCellValue(safe(rowData.get("planned_hours")));
                row.createCell(5).setCellValue(safe(rowData.get("actual_hours")));
                row.createCell(6).setCellValue(safe(rowData.get("status")));
            }

            for (int i = 0; i < 7; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            content = out.toByteArray();
        } catch (Exception ex) {
            throw new RuntimeException("Failed to generate XLSX", ex);
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=teaching-export.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(content);
    }

    private String safe(Object value) {
        if (value == null) return "";
        String s = value.toString().replace("\"", "\"\"");
        if (s.contains(",") || s.contains("\n")) {
            return "\"" + s + "\"";
        }
        return s;
    }
}
