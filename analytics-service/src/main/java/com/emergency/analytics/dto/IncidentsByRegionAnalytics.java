package com.emergency.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncidentsByRegionAnalytics {
    private Map<String, Long> incidentsByRegion;
    private Map<String, Map<String, Long>> incidentsByRegionAndType;
    private Long totalIncidents;
    private List<RegionStat> topRegions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegionStat {
        private String region;
        private Long count;
    }
}
