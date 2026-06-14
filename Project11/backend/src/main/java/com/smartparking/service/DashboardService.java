package com.smartparking.service;

import com.smartparking.entity.ParkingSpot;
import com.smartparking.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class DashboardService {

    @Autowired
    private ParkingSpotRepository parkingSpotRepository;

    @Autowired
    private EntryExitRecordRepository entryExitRecordRepository;

    @Autowired
    private BillingRecordRepository billingRecordRepository;

    @Autowired
    private AlertEventRepository alertEventRepository;

    @Autowired
    private BillingService billingService;

    @Autowired
    private EntryExitService entryExitService;

    public Map<String, Object> getOverview() {
        long totalSpots = parkingSpotRepository.count();
        long occupied = parkingSpotRepository.countByStatus(ParkingSpot.SpotStatus.OCCUPIED);
        long free = parkingSpotRepository.countByStatus(ParkingSpot.SpotStatus.FREE);
        long todayEntries = entryExitService.countTodayEntries();
        double todayRevenue = billingService.calculateTodayRevenue();
        long pendingAlerts = alertEventRepository.countByStatus(com.smartparking.entity.AlertEvent.AlertStatus.PENDING);

        Map<String, Object> overview = new HashMap<>();
        overview.put("totalSpots", totalSpots);
        overview.put("occupied", occupied);
        overview.put("free", free);
        overview.put("todayEntries", todayEntries);
        overview.put("todayRevenue", todayRevenue);
        overview.put("pendingAlerts", pendingAlerts);
        overview.put("occupancyRate", totalSpots > 0 ? String.format("%.1f", (double) occupied / totalSpots * 100) : "0.0");
        return overview;
    }

    public Map<String, Object> getTodayStats() {
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        long todayEntries = entryExitService.countTodayEntries();
        double todayRevenue = billingService.calculateTodayRevenue();
        long currentParked = entryExitRecordRepository.countByStatus(com.smartparking.entity.EntryExitRecord.RecordStatus.PARKING);

        Map<String, Object> stats = new HashMap<>();
        stats.put("todayEntries", todayEntries);
        stats.put("todayRevenue", todayRevenue);
        stats.put("currentParked", currentParked);
        return stats;
    }

    public Map<String, Object> getChartData() {
        Map<String, Long> spotStats = Map.of(
                "free", parkingSpotRepository.countByStatus(ParkingSpot.SpotStatus.FREE),
                "occupied", parkingSpotRepository.countByStatus(ParkingSpot.SpotStatus.OCCUPIED),
                "reserved", parkingSpotRepository.countByStatus(ParkingSpot.SpotStatus.RESERVED),
                "maintenance", parkingSpotRepository.countByStatus(ParkingSpot.SpotStatus.MAINTENANCE)
        );

        Map<String, Object> chart = new HashMap<>();
        chart.put("spotDistribution", spotStats);
        return chart;
    }
}
