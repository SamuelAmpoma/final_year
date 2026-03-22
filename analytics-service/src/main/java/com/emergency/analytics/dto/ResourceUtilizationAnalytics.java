package com.emergency.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceUtilizationAnalytics {
    private Map<String, Long> deploymentsByResponderType;
    private Map<String, Long> incidentsByType;
    private Long totalVehicles;
    private Long activeVehicles;
    private Long availableVehicles;
    private Map<String, Object> hospitalCapacity;
}
