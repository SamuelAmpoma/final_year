package com.emergency.dispatch.dto;

import com.emergency.dispatch.model.VehicleStatus;
import com.emergency.dispatch.model.VehicleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleDTO {
    private Long id;
    private String registrationNumber;
    private VehicleType vehicleType;
    private Long stationId;
    private String stationName;
    private String driverName;
    private String driverPhone;
    private Long currentIncidentId;
    private Double latitude;
    private Double longitude;
    private VehicleStatus status;
    private LocalDateTime lastUpdated;
}
