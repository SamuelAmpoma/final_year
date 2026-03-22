package com.emergency.incident.repository;

import com.emergency.incident.model.ResponderStation;
import com.emergency.incident.model.StationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResponderStationRepository extends JpaRepository<ResponderStation, Long> {

    List<ResponderStation> findByStationTypeAndIsAvailableTrue(StationType stationType);

    List<ResponderStation> findByStationType(StationType stationType);

    List<ResponderStation> findByIsAvailableTrue();
}
