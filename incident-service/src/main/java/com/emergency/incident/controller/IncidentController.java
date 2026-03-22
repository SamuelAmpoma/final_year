package com.emergency.incident.controller;

import com.emergency.incident.dto.*;
import com.emergency.incident.service.IncidentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/incidents")
@Tag(name = "Incidents", description = "Emergency incident management endpoints")
public class IncidentController {

    private final IncidentService incidentService;

    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    @PostMapping
    @Operation(summary = "Create a new incident", description = "Records a new emergency incident and auto-assigns nearest responder")
    public ResponseEntity<IncidentDTO> createIncident(
            @Valid @RequestBody CreateIncidentRequest request,
            Authentication authentication) {
        // In production, extract admin ID from the JWT or auth service
        // For now, using a default admin ID
        Long adminId = 1L;
        IncidentDTO incident = incidentService.createIncident(request, adminId);
        return ResponseEntity.status(HttpStatus.CREATED).body(incident);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get incident by ID", description = "Retrieves details of a specific incident")
    public ResponseEntity<IncidentDTO> getIncident(@PathVariable Long id) {
        IncidentDTO incident = incidentService.getIncidentById(id);
        return ResponseEntity.ok(incident);
    }

    @GetMapping("/open")
    @Operation(summary = "Get open incidents", description = "Retrieves all non-resolved incidents")
    public ResponseEntity<List<IncidentDTO>> getOpenIncidents() {
        List<IncidentDTO> incidents = incidentService.getOpenIncidents();
        return ResponseEntity.ok(incidents);
    }

    @GetMapping
    @Operation(summary = "Get all incidents", description = "Retrieves all incidents")
    public ResponseEntity<List<IncidentDTO>> getAllIncidents() {
        List<IncidentDTO> incidents = incidentService.getAllIncidents();
        return ResponseEntity.ok(incidents);
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update incident status", description = "Updates the status of an incident")
    public ResponseEntity<IncidentDTO> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusRequest request) {
        IncidentDTO incident = incidentService.updateIncidentStatus(id, request);
        return ResponseEntity.ok(incident);
    }

    @PutMapping("/{id}/assign")
    @Operation(summary = "Assign unit to incident", description = "Manually assigns a responder unit to an incident")
    public ResponseEntity<IncidentDTO> assignUnit(
            @PathVariable Long id,
            @Valid @RequestBody AssignUnitRequest request) {
        IncidentDTO incident = incidentService.assignUnit(id, request);
        return ResponseEntity.ok(incident);
    }
}
