package com.emergency.dispatch.controller;

import com.emergency.dispatch.dto.LocationUpdateRequest;
import com.emergency.dispatch.dto.VehicleDTO;
import com.emergency.dispatch.service.VehicleService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class LocationWebSocketController {

    private final VehicleService vehicleService;

    public LocationWebSocketController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    /**
     * Receives location updates via WebSocket STOMP and broadcasts to subscribers.
     * Client sends to: /app/location-update
     * Subscribers receive on: /topic/vehicle-locations
     */
    @MessageMapping("/location-update")
    @SendTo("/topic/vehicle-locations")
    public VehicleDTO handleLocationUpdate(LocationUpdateRequest request) {
        return vehicleService.updateLocation(request);
    }
}
