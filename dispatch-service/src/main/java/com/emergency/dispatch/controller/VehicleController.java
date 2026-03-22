package com.emergency.dispatch.controller;

import com.emergency.dispatch.dto.*;
import com.emergency.dispatch.model.LocationHistory;
import com.emergency.dispatch.model.VehicleStatus;
import com.emergency.dispatch.service.VehicleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/vehicles")
@Tag(name = "Vehicles", description = "Vehicle and dispatch tracking endpoints")
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new vehicle", description = "Register an emergency response vehicle")
    public ResponseEntity<VehicleDTO> registerVehicle(@Valid @RequestBody RegisterVehicleRequest request) {
        VehicleDTO vehicle = vehicleService.registerVehicle(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(vehicle);
    }

    @GetMapping
    @Operation(summary = "Get all vehicles", description = "Retrieves all registered vehicles")
    public ResponseEntity<List<VehicleDTO>> getAllVehicles() {
        return ResponseEntity.ok(vehicleService.getAllVehicles());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get vehicle by ID")
    public ResponseEntity<VehicleDTO> getVehicle(@PathVariable Long id) {
        return ResponseEntity.ok(vehicleService.getVehicleById(id));
    }

    @GetMapping("/{id}/location")
    @Operation(summary = "Get vehicle current location", description = "Returns the latest GPS coordinates of a vehicle")
    public ResponseEntity<VehicleDTO> getVehicleLocation(@PathVariable Long id) {
        return ResponseEntity.ok(vehicleService.getVehicleLocation(id));
    }

    @PostMapping("/location")
    @Operation(summary = "Update vehicle location", description = "Receives GPS location update from a vehicle and broadcasts via WebSocket")
    public ResponseEntity<VehicleDTO> updateLocation(@RequestBody LocationUpdateRequest request) {
        VehicleDTO vehicle = vehicleService.updateLocation(request);
        return ResponseEntity.ok(vehicle);
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update vehicle status")
    public ResponseEntity<VehicleDTO> updateStatus(
            @PathVariable Long id,
            @RequestParam VehicleStatus status) {
        return ResponseEntity.ok(vehicleService.updateVehicleStatus(id, status));
    }

    @PutMapping("/{vehicleId}/assign/{incidentId}")
    @Operation(summary = "Assign vehicle to incident")
    public ResponseEntity<VehicleDTO> assignToIncident(
            @PathVariable Long vehicleId,
            @PathVariable Long incidentId) {
        return ResponseEntity.ok(vehicleService.assignToIncident(vehicleId, incidentId));
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Get vehicle location history", description = "Returns the GPS trail of a vehicle")
    public ResponseEntity<List<LocationHistory>> getLocationHistory(@PathVariable Long id) {
        return ResponseEntity.ok(vehicleService.getLocationHistory(id));
    }
}
