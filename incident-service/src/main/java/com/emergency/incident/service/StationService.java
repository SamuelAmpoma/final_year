package com.emergency.incident.service;

import com.emergency.incident.dto.CreateStationRequest;
import com.emergency.incident.model.ResponderStation;
import com.emergency.incident.model.StationType;
import com.emergency.incident.repository.ResponderStationRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StationService {

    private final ResponderStationRepository stationRepository;

    public StationService(ResponderStationRepository stationRepository) {
        this.stationRepository = stationRepository;
    }

    public ResponderStation createStation(CreateStationRequest request) {
        ResponderStation station = ResponderStation.builder()
                .name(request.getName())
                .stationType(request.getStationType())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .address(request.getAddress())
                .phoneNumber(request.getPhoneNumber())
                .capacity(request.getCapacity())
                .isAvailable(true)
                .currentOccupancy(0)
                .build();

        return stationRepository.save(station);
    }

    public List<ResponderStation> getAllStations() {
        return stationRepository.findAll();
    }

    public List<ResponderStation> getStationsByType(StationType type) {
        return stationRepository.findByStationType(type);
    }

    public ResponderStation getStationById(Long id) {
        return stationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Station not found with id: " + id));
    }

    public ResponderStation updateStationAvailability(Long id, boolean available) {
        ResponderStation station = getStationById(id);
        station.setIsAvailable(available);
        return stationRepository.save(station);
    }

    public ResponderStation updateStationCapacity(Long id, int capacity, int occupancy) {
        ResponderStation station = getStationById(id);
        station.setCapacity(capacity);
        station.setCurrentOccupancy(occupancy);
        return stationRepository.save(station);
    }
}
