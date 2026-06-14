package com.smartparking.service;

import com.smartparking.entity.*;
import com.smartparking.repository.*;
import com.smartparking.websocket.ParkingWebSocketHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EntryExitService {

    @Autowired
    private ParkingSpotRepository parkingSpotRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private EntryExitRecordRepository entryExitRecordRepository;

    @Autowired
    private BillingRuleRepository billingRuleRepository;

    @Autowired
    private MonthlyRentalRepository monthlyRentalRepository;

    @Autowired
    private ParkingWebSocketHandler webSocketHandler;

    @Transactional
    public EntryExitRecord vehicleEntry(String plateNumber) {
        var existing = entryExitRecordRepository.findByPlateNumberAndStatus(plateNumber, EntryExitRecord.RecordStatus.PARKING);
        if (existing.isPresent()) {
            return null;
        }

        List<ParkingSpot> freeSpots = parkingSpotRepository.findByStatus(ParkingSpot.SpotStatus.FREE);
        if (freeSpots.isEmpty()) {
            return null;
        }

        ParkingSpot spot = freeSpots.get(0);
        spot.setStatus(ParkingSpot.SpotStatus.OCCUPIED);
        spot.setPlateNumber(plateNumber);
        parkingSpotRepository.save(spot);

        EntryExitRecord record = new EntryExitRecord();
        record.setPlateNumber(plateNumber);
        record.setSpotId(spot.getId());
        record.setEntryTime(LocalDateTime.now());
        record.setStatus(EntryExitRecord.RecordStatus.PARKING);
        record.setCreatedAt(LocalDateTime.now());
        EntryExitRecord saved = entryExitRecordRepository.save(record);

        Map<String, Object> entryData = new HashMap<>();
        entryData.put("plateNumber", plateNumber);
        entryData.put("spotId", spot.getId());
        entryData.put("spotNumber", spot.getSpotNumber());
        entryData.put("entryTime", record.getEntryTime().toString());
        webSocketHandler.broadcastUpdate("VEHICLE_ENTRY", entryData);

        return saved;
    }

    @Transactional
    public Map<String, Object> vehicleExit(String plateNumber) {
        var recordOpt = entryExitRecordRepository.findByPlateNumberAndStatus(plateNumber, EntryExitRecord.RecordStatus.PARKING);
        if (recordOpt.isEmpty()) {
            return null;
        }

        EntryExitRecord record = recordOpt.get();
        LocalDateTime exitTime = LocalDateTime.now();
        record.setExitTime(exitTime);
        long durationMinutes = Duration.between(record.getEntryTime(), exitTime).toMinutes();
        record.setDuration(durationMinutes);
        record.setStatus(EntryExitRecord.RecordStatus.COMPLETED);
        entryExitRecordRepository.save(record);

        ParkingSpot spot = parkingSpotRepository.findById(record.getSpotId()).orElse(null);
        if (spot != null) {
            spot.setStatus(ParkingSpot.SpotStatus.FREE);
            spot.setPlateNumber(null);
            parkingSpotRepository.save(spot);
        }

        boolean isMonthly = monthlyRentalRepository.findByPlateNumberAndStatus(plateNumber, MonthlyRental.RentalStatus.ACTIVE).isPresent();
        double fee = 0;
        if (!isMonthly) {
            BillingRule rule = billingRuleRepository.findByType("standard").orElse(null);
            if (rule != null) {
                double hours = Math.ceil(durationMinutes / 60.0);
                if (hours <= 1) {
                    fee = rule.getFirstHourFee();
                } else {
                    fee = rule.getFirstHourFee() + (hours - 1) * rule.getAdditionalHourFee();
                }
                if (fee > rule.getDailyMaxFee()) {
                    fee = rule.getDailyMaxFee();
                }
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("record", record);
        result.put("fee", fee);
        result.put("isMonthly", isMonthly);
        result.put("durationMinutes", durationMinutes);

        Map<String, Object> exitData = new HashMap<>();
        exitData.put("plateNumber", plateNumber);
        exitData.put("spotId", record.getSpotId());
        exitData.put("fee", fee);
        exitData.put("exitTime", exitTime.toString());
        webSocketHandler.broadcastUpdate("VEHICLE_EXIT", exitData);

        return result;
    }

    public List<EntryExitRecord> listRecords() {
        return entryExitRecordRepository.findAllByOrderByEntryTimeDesc();
    }

    public List<EntryExitRecord> getCurrentParkedVehicles() {
        return entryExitRecordRepository.findByStatus(EntryExitRecord.RecordStatus.PARKING);
    }

    public long countTodayEntries() {
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        return entryExitRecordRepository.findByEntryTimeBetween(startOfDay, LocalDateTime.now()).size();
    }
}
