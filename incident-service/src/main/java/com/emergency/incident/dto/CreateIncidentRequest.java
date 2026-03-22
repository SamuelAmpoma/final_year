package com.emergency.incident.dto;

import com.emergency.incident.model.IncidentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateIncidentRequest {

    @NotBlank(message = "Citizen name is required")
    private String citizenName;

    private String citizenPhone;

    @NotNull(message = "Incident type is required")
    private IncidentType incidentType;

    @NotNull(message = "Latitude is required")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    private Double longitude;

    private String locationAddress;

    private String notes;
}
