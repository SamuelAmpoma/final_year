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
public class ResponseTimeAnalytics {
    private Double averageResponseTimeMinutes;
    private Map<String, Double> averageByIncidentType;
    private Long totalIncidents;
    private Long resolvedIncidents;
    private Long openIncidents;
}
