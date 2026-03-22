package com.emergency.incident.dto;

import com.emergency.incident.model.IncidentStatus;
import com.emergency.incident.model.IncidentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncidentDTO {
    private Long id;
    private String citizenName;
    private String citizenPhone;
    private IncidentType incidentType;
    private Double latitude;
    private Double longitude;
    private String locationAddress;
    private String notes;
    private Long createdBy;
    private Long assignedUnitId;
    private String assignedUnitName;
    private String assignedUnitType;
    private IncidentStatus status;
    private LocalDateTime timestamp;
    private LocalDateTime dispatchedAt;
    private LocalDateTime resolvedAt;
}
