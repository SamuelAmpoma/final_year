package com.emergency.analytics.repository;

import com.emergency.analytics.model.AnalyticsEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AnalyticsEventRepository extends JpaRepository<AnalyticsEvent, Long> {

    List<AnalyticsEvent> findByEventType(String eventType);

    List<AnalyticsEvent> findByIncidentType(String incidentType);

    List<AnalyticsEvent> findByRegion(String region);

    @Query("SELECT AVG(a.responseTimeMinutes) FROM AnalyticsEvent a WHERE a.responseTimeMinutes IS NOT NULL")
    Double findAverageResponseTime();

    @Query("SELECT a.incidentType, COUNT(a) FROM AnalyticsEvent a WHERE a.incidentType IS NOT NULL GROUP BY a.incidentType")
    List<Object[]> countByIncidentType();

    @Query("SELECT a.region, COUNT(a) FROM AnalyticsEvent a WHERE a.region IS NOT NULL GROUP BY a.region")
    List<Object[]> countByRegion();

    @Query("SELECT a.responderType, COUNT(a) FROM AnalyticsEvent a WHERE a.responderType IS NOT NULL GROUP BY a.responderType")
    List<Object[]> countByResponderType();

    @Query("SELECT a.region, a.incidentType, COUNT(a) FROM AnalyticsEvent a WHERE a.region IS NOT NULL AND a.incidentType IS NOT NULL GROUP BY a.region, a.incidentType")
    List<Object[]> countByRegionAndIncidentType();

    List<AnalyticsEvent> findByTimestampBetween(LocalDateTime start, LocalDateTime end);
}
