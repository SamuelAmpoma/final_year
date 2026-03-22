package com.emergency.dispatch.service;

import com.emergency.dispatch.dto.*;
import com.emergency.dispatch.model.LocationHistory;
import com.emergency.dispatch.model.Vehicle;
import com.emergency.dispatch.model.VehicleStatus;
import com.emergency.dispatch.repository.LocationHistoryRepository;
import com.emergency.dispatch.repository.VehicleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class VehicleService {

    private static final Logger log = LoggerFactory.getLogger(VehicleService.class);

    private final VehicleRepository vehicleRepository;
    private final LocationHistoryRepository locationHistoryRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public VehicleService(VehicleRepository vehicleRepository,
                          LocationHistoryRepository locationHistoryRepository,
                          SimpMessagingTemplate messagingTemplate) {
        this.vehicleRepository = vehicleRepository;
        this.locationHistoryRepository = locationHistoryRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public VehicleDTO registerVehicle(RegisterVehicleRequest request) {
        if (vehicleRepository.existsByRegistrationNumber(request.getRegistrationNumber())) {
            throw new RuntimeException("Vehicle with registration number already exists: " + request.getRegistrationNumber());
        }

        Vehicle vehicle = Vehicle.builder()
                .registrationNumber(request.getRegistrationNumber())
                .vehicleType(request.getVehicleType())
                .stationId(request.getStationId())
                .stationName(request.getStationName())
                .driverName(request.getDriverName())
                .driverPhone(request.getDriverPhone())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .status(VehicleStatus.AVAILABLE)
                .build();

        vehicle = vehicleRepository.save(vehicle);
        log.info("Vehicle registered: {} ({})", vehicle.getRegistrationNumber(), vehicle.getVehicleType());

        return mapToDTO(vehicle);
    }

    public List<VehicleDTO> getAllVehicles() {
        return vehicleRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public VehicleDTO getVehicleById(Long id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + id));
        return mapToDTO(vehicle);
    }

    public VehicleDTO getVehicleLocation(Long id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + id));
        return mapToDTO(vehicle);
    }

    @Transactional
    public VehicleDTO updateLocation(LocationUpdateRequest request) {
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + request.getVehicleId()));

        vehicle.setLatitude(request.getLatitude());
        vehicle.setLongitude(request.getLongitude());
        vehicle = vehicleRepository.save(vehicle);

        // Save location history
        LocationHistory history = LocationHistory.builder()
                .vehicleId(vehicle.getId())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .build();
        locationHistoryRepository.save(history);

        VehicleDTO dto = mapToDTO(vehicle);

        // Broadcast location update via WebSocket
        messagingTemplate.convertAndSend("/topic/vehicle-locations", dto);
        messagingTemplate.convertAndSend("/topic/vehicle/" + vehicle.getId(), dto);

        log.debug("Vehicle {} location updated: ({}, {})",
                vehicle.getRegistrationNumber(), request.getLatitude(), request.getLongitude());

        return dto;
    }

    @Transactional
    public VehicleDTO updateVehicleStatus(Long id, VehicleStatus status) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + id));

        vehicle.setStatus(status);
        vehicle = vehicleRepository.save(vehicle);

        return mapToDTO(vehicle);
    }

    @Transactional
    public VehicleDTO assignToIncident(Long vehicleId, Long incidentId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + vehicleId));

        vehicle.setCurrentIncidentId(incidentId);
        vehicle.setStatus(VehicleStatus.DISPATCHED);
        vehicle = vehicleRepository.save(vehicle);

        return mapToDTO(vehicle);
    }

    public List<LocationHistory> getLocationHistory(Long vehicleId) {
        return locationHistoryRepository.findByVehicleIdOrderByTimestampDesc(vehicleId);
    }

    private VehicleDTO mapToDTO(Vehicle vehicle) {
        return VehicleDTO.builder()
                .id(vehicle.getId())
                .registrationNumber(vehicle.getRegistrationNumber())
                .vehicleType(vehicle.getVehicleType())
                .stationId(vehicle.getStationId())
                .stationName(vehicle.getStationName())
                .driverName(vehicle.getDriverName())
                .driverPhone(vehicle.getDriverPhone())
                .currentIncidentId(vehicle.getCurrentIncidentId())
                .latitude(vehicle.getLatitude())
                .longitude(vehicle.getLongitude())
                .status(vehicle.getStatus())
                .lastUpdated(vehicle.getLastUpdated())
                .build();
    }
}
