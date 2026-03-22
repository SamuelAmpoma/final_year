package com.emergency.incident.config;

import com.emergency.incident.model.ResponderStation;
import com.emergency.incident.model.StationType;
import com.emergency.incident.repository.ResponderStationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class DataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    @Bean
    CommandLineRunner seedData(ResponderStationRepository stationRepository) {
        return args -> {
            if (stationRepository.count() == 0) {
                log.info("Seeding responder stations...");

                List<ResponderStation> stations = List.of(
                        // Police Stations in Accra
                        ResponderStation.builder()
                                .name("Accra Central Police Station")
                                .stationType(StationType.POLICE_STATION)
                                .latitude(5.5500).longitude(-0.2000)
                                .address("Accra Central, Greater Accra")
                                .phoneNumber("+233-302-123456")
                                .isAvailable(true).capacity(50).currentOccupancy(0)
                                .build(),
                        ResponderStation.builder()
                                .name("Madina Police Station")
                                .stationType(StationType.POLICE_STATION)
                                .latitude(5.6698).longitude(-0.1666)
                                .address("Madina, Greater Accra")
                                .phoneNumber("+233-302-234567")
                                .isAvailable(true).capacity(30).currentOccupancy(0)
                                .build(),
                        ResponderStation.builder()
                                .name("Tema Police Station")
                                .stationType(StationType.POLICE_STATION)
                                .latitude(5.6698).longitude(-0.0166)
                                .address("Tema, Greater Accra")
                                .phoneNumber("+233-302-345678")
                                .isAvailable(true).capacity(40).currentOccupancy(0)
                                .build(),

                        // Fire Stations
                        ResponderStation.builder()
                                .name("Accra Fire Service HQ")
                                .stationType(StationType.FIRE_STATION)
                                .latitude(5.5560).longitude(-0.1969)
                                .address("Ring Road, Accra")
                                .phoneNumber("+233-302-456789")
                                .isAvailable(true).capacity(20).currentOccupancy(0)
                                .build(),
                        ResponderStation.builder()
                                .name("Tema Fire Station")
                                .stationType(StationType.FIRE_STATION)
                                .latitude(5.6700).longitude(-0.0200)
                                .address("Tema Industrial Area")
                                .phoneNumber("+233-302-567890")
                                .isAvailable(true).capacity(15).currentOccupancy(0)
                                .build(),

                        // Hospitals
                        ResponderStation.builder()
                                .name("Korle Bu Teaching Hospital")
                                .stationType(StationType.HOSPITAL)
                                .latitude(5.5364).longitude(-0.2279)
                                .address("Guggisberg Avenue, Accra")
                                .phoneNumber("+233-302-670001")
                                .isAvailable(true).capacity(200).currentOccupancy(120)
                                .build(),
                        ResponderStation.builder()
                                .name("37 Military Hospital")
                                .stationType(StationType.HOSPITAL)
                                .latitude(5.5833).longitude(-0.1833)
                                .address("37 Hospital Road, Accra")
                                .phoneNumber("+233-302-770001")
                                .isAvailable(true).capacity(150).currentOccupancy(80)
                                .build(),
                        ResponderStation.builder()
                                .name("Ridge Hospital")
                                .stationType(StationType.HOSPITAL)
                                .latitude(5.5667).longitude(-0.2000)
                                .address("Castle Road, Ridge, Accra")
                                .phoneNumber("+233-302-228485")
                                .isAvailable(true).capacity(180).currentOccupancy(95)
                                .build(),
                        ResponderStation.builder()
                                .name("Tema General Hospital")
                                .stationType(StationType.HOSPITAL)
                                .latitude(5.6600).longitude(-0.0100)
                                .address("Community 1, Tema")
                                .phoneNumber("+233-303-202282")
                                .isAvailable(true).capacity(120).currentOccupancy(60)
                                .build()
                );

                stationRepository.saveAll(stations);
                log.info("Seeded {} responder stations", stations.size());
            } else {
                log.info("Stations already seeded, skipping...");
            }
        };
    }
}
