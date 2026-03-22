package com.emergency.dispatch.repository;

import com.emergency.dispatch.model.LocationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LocationHistoryRepository extends JpaRepository<LocationHistory, Long> {

    List<LocationHistory> findByVehicleIdOrderByTimestampDesc(Long vehicleId);

    List<LocationHistory> findByVehicleIdAndTimestampBetween(Long vehicleId, LocalDateTime start, LocalDateTime end);

    LocationHistory findTopByVehicleIdOrderByTimestampDesc(Long vehicleId);
}
