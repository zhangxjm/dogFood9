package com.smartparking.scheduler;

import com.smartparking.entity.AlertEvent;
import com.smartparking.entity.EntryExitRecord;
import com.smartparking.entity.HardwareDevice;
import com.smartparking.entity.MonthlyRental;
import com.smartparking.hardware.DeviceConnectionManager;
import com.smartparking.hardware.HardwareSimulator;
import com.smartparking.repository.EntryExitRecordRepository;
import com.smartparking.repository.HardwareDeviceRepository;
import com.smartparking.service.AlertService;
import com.smartparking.service.EntryExitService;
import com.smartparking.service.MonthlyRentalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class ParkingScheduler {

    @Autowired
    private HardwareDeviceRepository hardwareDeviceRepository;

    @Autowired
    private DeviceConnectionManager deviceConnectionManager;

    @Autowired
    private MonthlyRentalService monthlyRentalService;

    @Autowired
    private EntryExitRecordRepository entryExitRecordRepository;

    @Autowired
    private AlertService alertService;

    @Autowired
    private EntryExitService entryExitService;

    @Autowired
    private HardwareSimulator hardwareSimulator;

    @Scheduled(fixedRate = 60000)
    public void checkDeviceHeartbeats() {
        List<HardwareDevice> devices = hardwareDeviceRepository.findByStatus(HardwareDevice.DeviceStatus.ONLINE);
        for (HardwareDevice device : devices) {
            deviceConnectionManager.checkHeartbeat(device.getId());
        }
    }

    @Scheduled(fixedRate = 60000)
    public void checkMonthlyRentalExpiry() {
        monthlyRentalService.expireRentals();
        List<MonthlyRental> expiring = monthlyRentalService.findExpiringRentals();
        for (MonthlyRental rental : expiring) {
            AlertEvent alert = new AlertEvent();
            alert.setType(AlertEvent.AlertType.ILLEGAL_PARKING);
            alert.setDescription("月租即将到期: " + rental.getPlateNumber() + ", 到期日: " + rental.getEndDate());
            alertService.createAlert(alert);
        }
    }

    @Scheduled(fixedRate = 60000)
    public void checkOverstayedVehicles() {
        List<EntryExitRecord> parkedRecords = entryExitRecordRepository.findByStatus(EntryExitRecord.RecordStatus.PARKING);
        for (EntryExitRecord record : parkedRecords) {
            long hours = Duration.between(record.getEntryTime(), LocalDateTime.now()).toHours();
            if (hours > 24) {
                AlertEvent alert = new AlertEvent();
                alert.setType(AlertEvent.AlertType.OVERSTAY);
                alert.setDescription("车辆超时停放: " + record.getPlateNumber() + ", 已停放" + hours + "小时");
                alertService.createAlert(alert);
            }
        }
    }

    @Scheduled(fixedRate = 30000)
    public void simulateRandomVehicleActivity() {
        try {
            double rand = Math.random();
            if (rand < 0.5) {
                String plate = hardwareSimulator.recognizePlate();
                entryExitService.vehicleEntry(plate);
            } else {
                List<EntryExitRecord> parked = entryExitRecordRepository.findByStatus(EntryExitRecord.RecordStatus.PARKING);
                if (!parked.isEmpty()) {
                    int index = (int) (Math.random() * parked.size());
                    entryExitService.vehicleExit(parked.get(index).getPlateNumber());
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
