package com.emergency.dispatch.repository;

import com.emergency.dispatch.model.Vehicle;
import com.emergency.dispatch.model.VehicleStatus;
import com.emergency.dispatch.model.VehicleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    Optional<Vehicle> findByRegistrationNumber(String registrationNumber);

    List<Vehicle> findByStationId(Long stationId);

    List<Vehicle> findByVehicleType(VehicleType vehicleType);

    List<Vehicle> findByStatus(VehicleStatus status);

    List<Vehicle> findByVehicleTypeAndStatus(VehicleType vehicleType, VehicleStatus status);

    List<Vehicle> findByCurrentIncidentId(Long incidentId);

    boolean existsByRegistrationNumber(String registrationNumber);
}
