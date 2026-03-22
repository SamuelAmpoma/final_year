package com.emergency.incident.controller;

import com.emergency.incident.dto.CreateStationRequest;
import com.emergency.incident.model.ResponderStation;
import com.emergency.incident.model.StationType;
import com.emergency.incident.service.StationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/stations")
@Tag(name = "Stations", description = "Responder station management endpoints")
public class StationController {

    private final StationService stationService;

    public StationController(StationService stationService) {
        this.stationService = stationService;
    }

    @PostMapping
    @Operation(summary = "Create a new station", description = "Register a new responder station (police, fire, hospital)")
    public ResponseEntity<ResponderStation> createStation(@Valid @RequestBody CreateStationRequest request) {
        ResponderStation station = stationService.createStation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(station);
    }

    @GetMapping
    @Operation(summary = "Get all stations", description = "Retrieves all registered responder stations")
    public ResponseEntity<List<ResponderStation>> getAllStations() {
        return ResponseEntity.ok(stationService.getAllStations());
    }

    @GetMapping("/type/{type}")
    @Operation(summary = "Get stations by type", description = "Retrieves stations filtered by type")
    public ResponseEntity<List<ResponderStation>> getStationsByType(@PathVariable StationType type) {
        return ResponseEntity.ok(stationService.getStationsByType(type));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get station by ID")
    public ResponseEntity<ResponderStation> getStationById(@PathVariable Long id) {
        return ResponseEntity.ok(stationService.getStationById(id));
    }

    @PutMapping("/{id}/availability")
    @Operation(summary = "Update station availability")
    public ResponseEntity<ResponderStation> updateAvailability(
            @PathVariable Long id,
            @RequestParam boolean available) {
        return ResponseEntity.ok(stationService.updateStationAvailability(id, available));
    }

    @PutMapping("/{id}/capacity")
    @Operation(summary = "Update station capacity", description = "Update hospital capacity and current occupancy")
    public ResponseEntity<ResponderStation> updateCapacity(
            @PathVariable Long id,
            @RequestParam int capacity,
            @RequestParam int occupancy) {
        return ResponseEntity.ok(stationService.updateStationCapacity(id, capacity, occupancy));
    }
}
