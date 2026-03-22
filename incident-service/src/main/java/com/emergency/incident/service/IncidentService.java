package com.emergency.incident.service;

import com.emergency.incident.dto.*;
import com.emergency.incident.model.*;
import com.emergency.incident.repository.IncidentRepository;
import com.emergency.incident.repository.ResponderStationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class IncidentService {

    private static final Logger log = LoggerFactory.getLogger(IncidentService.class);
    private static final double EARTH_RADIUS_KM = 6371.0;

    private final IncidentRepository incidentRepository;
    private final ResponderStationRepository stationRepository;

    public IncidentService(IncidentRepository incidentRepository,
                           ResponderStationRepository stationRepository) {
        this.incidentRepository = incidentRepository;
        this.stationRepository = stationRepository;
    }

    @Transactional
    public IncidentDTO createIncident(CreateIncidentRequest request, Long adminId) {
        Incident incident = Incident.builder()
                .citizenName(request.getCitizenName())
                .citizenPhone(request.getCitizenPhone())
                .incidentType(request.getIncidentType())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .locationAddress(request.getLocationAddress())
                .notes(request.getNotes())
                .createdBy(adminId)
                .status(IncidentStatus.CREATED)
                .build();

        incident = incidentRepository.save(incident);

        // Auto-assign nearest available responder
        try {
            StationType requiredStationType = determineStationType(request.getIncidentType());
            ResponderStation nearestStation = findNearestAvailableStation(
                    request.getLatitude(), request.getLongitude(), requiredStationType
            );

            if (nearestStation != null) {
                incident.setAssignedUnitId(nearestStation.getId());
                incident.setAssignedUnitName(nearestStation.getName());
                incident.setAssignedUnitType(nearestStation.getStationType().name());
                incident.setStatus(IncidentStatus.DISPATCHED);
                incident.setDispatchedAt(LocalDateTime.now());
                incident = incidentRepository.save(incident);
                log.info("Incident {} auto-assigned to station: {} ({})",
                        incident.getId(), nearestStation.getName(), nearestStation.getStationType());
            } else {
                log.warn("No available station found for incident type: {}", request.getIncidentType());
            }
        } catch (Exception e) {
            log.error("Error auto-assigning responder for incident {}: {}", incident.getId(), e.getMessage());
        }

        return mapToDTO(incident);
    }

    public IncidentDTO getIncidentById(Long id) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incident not found with id: " + id));
        return mapToDTO(incident);
    }

    public List<IncidentDTO> getOpenIncidents() {
        return incidentRepository.findOpenIncidents().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<IncidentDTO> getAllIncidents() {
        return incidentRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public IncidentDTO updateIncidentStatus(Long id, UpdateStatusRequest request) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incident not found with id: " + id));

        incident.setStatus(request.getStatus());

        if (request.getStatus() == IncidentStatus.RESOLVED) {
            incident.setResolvedAt(LocalDateTime.now());
        } else if (request.getStatus() == IncidentStatus.DISPATCHED) {
            incident.setDispatchedAt(LocalDateTime.now());
        }

        incident = incidentRepository.save(incident);
        return mapToDTO(incident);
    }

    @Transactional
    public IncidentDTO assignUnit(Long incidentId, AssignUnitRequest request) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new RuntimeException("Incident not found with id: " + incidentId));

        ResponderStation station = stationRepository.findById(request.getUnitId())
                .orElseThrow(() -> new RuntimeException("Station not found with id: " + request.getUnitId()));

        incident.setAssignedUnitId(station.getId());
        incident.setAssignedUnitName(station.getName());
        incident.setAssignedUnitType(station.getStationType().name());
        incident.setStatus(IncidentStatus.DISPATCHED);
        incident.setDispatchedAt(LocalDateTime.now());

        incident = incidentRepository.save(incident);
        return mapToDTO(incident);
    }

    /**
     * Determines the required station type based on incident type.
     */
    private StationType determineStationType(IncidentType incidentType) {
        return switch (incidentType) {
            case ROBBERY, CRIME, ASSAULT -> StationType.POLICE_STATION;
            case FIRE -> StationType.FIRE_STATION;
            case MEDICAL_EMERGENCY, ACCIDENT -> StationType.HOSPITAL;
            case NATURAL_DISASTER -> StationType.FIRE_STATION;
            case OTHER -> StationType.POLICE_STATION;
        };
    }

    /**
     * Finds the nearest available station of the required type using the Haversine formula.
     */
    private ResponderStation findNearestAvailableStation(double incidentLat, double incidentLon, StationType stationType) {
        List<ResponderStation> availableStations = stationRepository.findByStationTypeAndIsAvailableTrue(stationType);

        if (availableStations.isEmpty()) {
            return null;
        }

        return availableStations.stream()
                .min(Comparator.comparingDouble(station ->
                        calculateHaversineDistance(incidentLat, incidentLon, station.getLatitude(), station.getLongitude())
                ))
                .orElse(null);
    }

    /**
     * Calculates the distance between two geographic coordinates using the Haversine formula.
     * Returns distance in kilometers.
     */
    private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS_KM * c;
    }

    private IncidentDTO mapToDTO(Incident incident) {
        return IncidentDTO.builder()
                .id(incident.getId())
                .citizenName(incident.getCitizenName())
                .citizenPhone(incident.getCitizenPhone())
                .incidentType(incident.getIncidentType())
                .latitude(incident.getLatitude())
                .longitude(incident.getLongitude())
                .locationAddress(incident.getLocationAddress())
                .notes(incident.getNotes())
                .createdBy(incident.getCreatedBy())
                .assignedUnitId(incident.getAssignedUnitId())
                .assignedUnitName(incident.getAssignedUnitName())
                .assignedUnitType(incident.getAssignedUnitType())
                .status(incident.getStatus())
                .timestamp(incident.getTimestamp())
                .dispatchedAt(incident.getDispatchedAt())
                .resolvedAt(incident.getResolvedAt())
                .build();
    }
}
