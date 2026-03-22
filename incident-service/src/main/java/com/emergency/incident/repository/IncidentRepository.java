package com.emergency.incident.repository;

import com.emergency.incident.model.Incident;
import com.emergency.incident.model.IncidentStatus;
import com.emergency.incident.model.IncidentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, Long> {

    List<Incident> findByStatusNot(IncidentStatus status);

    List<Incident> findByStatus(IncidentStatus status);

    List<Incident> findByIncidentType(IncidentType incidentType);

    List<Incident> findByCreatedBy(Long adminId);

    @Query("SELECT i FROM Incident i WHERE i.status != 'RESOLVED'")
    List<Incident> findOpenIncidents();

    @Query("SELECT i FROM Incident i WHERE i.timestamp BETWEEN :start AND :end")
    List<Incident> findByTimestampBetween(LocalDateTime start, LocalDateTime end);

    long countByIncidentType(IncidentType incidentType);

    long countByStatus(IncidentStatus status);
}
