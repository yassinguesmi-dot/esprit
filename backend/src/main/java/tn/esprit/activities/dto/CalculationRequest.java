package tn.esprit.activities.dto;

import jakarta.validation.constraints.NotBlank;

public class CalculationRequest {
    @NotBlank
    private String academic_year;

    private String user_id;

    public String getAcademic_year() {
        return academic_year;
    }

    public void setAcademic_year(String academic_year) {
        this.academic_year = academic_year;
    }

    public String getUser_id() {
        return user_id;
    }

    public void setUser_id(String user_id) {
        this.user_id = user_id;
    }
}
