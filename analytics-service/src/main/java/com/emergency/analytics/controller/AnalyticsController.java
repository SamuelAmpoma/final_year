package com.emergency.analytics.controller;

import com.emergency.analytics.dto.*;
import com.emergency.analytics.model.AnalyticsEvent;
import com.emergency.analytics.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/analytics")
@Tag(name = "Analytics", description = "Analytics and monitoring endpoints")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/response-times")
    @Operation(summary = "Get response time analytics",
            description = "Returns average response times, breakdown by incident type, and overall incident statistics")
    public ResponseEntity<ResponseTimeAnalytics> getResponseTimes() {
        return ResponseEntity.ok(analyticsService.getResponseTimeAnalytics());
    }

    @GetMapping("/incidents-by-region")
    @Operation(summary = "Get incidents by region",
            description = "Returns incident counts grouped by region and incident type")
    public ResponseEntity<IncidentsByRegionAnalytics> getIncidentsByRegion() {
        return ResponseEntity.ok(analyticsService.getIncidentsByRegion());
    }

    @GetMapping("/resource-utilization")
    @Operation(summary = "Get resource utilization",
            description = "Returns resource deployment stats, vehicle utilization, and hospital bed capacity")
    public ResponseEntity<ResourceUtilizationAnalytics> getResourceUtilization() {
        return ResponseEntity.ok(analyticsService.getResourceUtilization());
    }

    @PostMapping("/events")
    @Operation(summary = "Record analytics event", description = "Manually record an analytics event for tracking")
    public ResponseEntity<AnalyticsEvent> recordEvent(@RequestBody AnalyticsEvent event) {
        return ResponseEntity.ok(analyticsService.recordEvent(event));
    }
}
