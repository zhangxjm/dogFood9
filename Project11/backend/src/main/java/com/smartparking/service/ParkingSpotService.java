package com.smartparking.service;

import com.smartparking.entity.ParkingSpot;
import com.smartparking.repository.ParkingSpotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class ParkingSpotService {

    @Autowired
    private ParkingSpotRepository parkingSpotRepository;

    public List<ParkingSpot> listAll() {
        return parkingSpotRepository.findAll();
    }

    public List<ParkingSpot> findByLotId(Long lotId) {
        return parkingSpotRepository.findByLotId(lotId);
    }

    public ParkingSpot findById(Long id) {
        return parkingSpotRepository.findById(id).orElse(null);
    }

    public Map<String, Long> countByStatus() {
        long free = parkingSpotRepository.countByStatus(ParkingSpot.SpotStatus.FREE);
        long occupied = parkingSpotRepository.countByStatus(ParkingSpot.SpotStatus.OCCUPIED);
        long reserved = parkingSpotRepository.countByStatus(ParkingSpot.SpotStatus.RESERVED);
        long maintenance = parkingSpotRepository.countByStatus(ParkingSpot.SpotStatus.MAINTENANCE);
        return Map.of("free", free, "occupied", occupied, "reserved", reserved, "maintenance", maintenance);
    }

    public ParkingSpot findByPlateNumber(String plateNumber) {
        return parkingSpotRepository.findByPlateNumber(plateNumber).orElse(null);
    }

    @Transactional
    public ParkingSpot updateStatus(Long id, ParkingSpot.SpotStatus status, String plateNumber) {
        ParkingSpot spot = parkingSpotRepository.findById(id).orElse(null);
        if (spot == null) {
            return null;
        }
        spot.setStatus(status);
        spot.setPlateNumber(plateNumber);
        return parkingSpotRepository.save(spot);
    }

    public long countFree() {
        return parkingSpotRepository.countByStatus(ParkingSpot.SpotStatus.FREE);
    }

    public ParkingSpot findFirstFree() {
        List<ParkingSpot> freeSpots = parkingSpotRepository.findByStatus(ParkingSpot.SpotStatus.FREE);
        return freeSpots.isEmpty() ? null : freeSpots.get(0);
    }

    public long countTotal() {
        return parkingSpotRepository.count();
    }

    public long countOccupied() {
        return parkingSpotRepository.countByStatus(ParkingSpot.SpotStatus.OCCUPIED);
    }
}
