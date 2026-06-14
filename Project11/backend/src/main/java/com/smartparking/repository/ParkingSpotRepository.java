package com.smartparking.repository;

import com.smartparking.entity.ParkingSpot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ParkingSpotRepository extends JpaRepository<ParkingSpot, Long> {
    List<ParkingSpot> findByLotId(Long lotId);
    List<ParkingSpot> findByFloor(String floor);
    List<ParkingSpot> findByStatus(ParkingSpot.SpotStatus status);
    List<ParkingSpot> findByLotIdAndStatus(Long lotId, ParkingSpot.SpotStatus status);
    long countByStatus(ParkingSpot.SpotStatus status);
    long countByLotIdAndStatus(Long lotId, ParkingSpot.SpotStatus status);
    Optional<ParkingSpot> findByPlateNumber(String plateNumber);
    List<ParkingSpot> findByZone(String zone);
}
