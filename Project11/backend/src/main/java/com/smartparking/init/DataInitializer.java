package com.smartparking.init;

import com.smartparking.entity.*;
import com.smartparking.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private ParkingLotRepository parkingLotRepository;

    @Autowired
    private ParkingSpotRepository parkingSpotRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private MonthlyRentalRepository monthlyRentalRepository;

    @Autowired
    private EntryExitRecordRepository entryExitRecordRepository;

    @Autowired
    private BillingRuleRepository billingRuleRepository;

    @Autowired
    private HardwareDeviceRepository hardwareDeviceRepository;

    @Autowired
    private SystemConfigRepository systemConfigRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (parkingSpotRepository.count() > 0) {
            return;
        }

        ParkingLot lot1 = new ParkingLot("1号停车场", "北京市朝阳区建国路1号", 90);
        lot1 = parkingLotRepository.save(lot1);

        ParkingLot lot2 = new ParkingLot("2号停车场", "北京市海淀区中关村大街1号", 60);
        lot2 = parkingLotRepository.save(lot2);

        String[] lot1Floors = {"A1F", "A2F", "A3F"};
        String[] lot1Zones = {"A", "B", "C", "D", "E"};
        for (String floor : lot1Floors) {
            for (String zone : lot1Zones) {
                for (int i = 1; i <= 10; i++) {
                    String spotNumber = floor + "-" + zone + "-" + String.format("%02d", i);
                    ParkingSpot spot = new ParkingSpot(lot1.getId(), floor, zone, spotNumber);
                    parkingSpotRepository.save(spot);
                }
            }
        }

        String[] lot2Floors = {"B1F", "B2F"};
        String[] lot2Zones = {"A", "B", "C"};
        for (String floor : lot2Floors) {
            for (String zone : lot2Zones) {
                for (int i = 1; i <= 10; i++) {
                    String spotNumber = floor + "-" + zone + "-" + String.format("%02d", i);
                    ParkingSpot spot = new ParkingSpot(lot2.getId(), floor, zone, spotNumber);
                    parkingSpotRepository.save(spot);
                }
            }
        }

        String[][] tempVehicles = {
                {"京A12345", "张三", "13800001111"},
                {"京B23456", "李四", "13800002222"},
                {"沪C34567", "王五", "13800003333"},
                {"粤D45678", "赵六", "13800004444"},
                {"浙E56789", "钱七", "13800005555"}
        };
        for (String[] v : tempVehicles) {
            Vehicle vehicle = new Vehicle(v[0], v[1], v[2], Vehicle.VehicleType.TEMPORARY);
            vehicleRepository.save(vehicle);
        }

        String[][] monthlyVehicles = {
                {"京F67890", "孙八", "13800006666"},
                {"京G78901", "周九", "13800007777"},
                {"京H89012", "吴十", "13800008888"},
                {"京I90123", "郑十一", "13800009999"},
                {"京J01234", "冯十二", "13800010000"}
        };
        for (String[] v : monthlyVehicles) {
            Vehicle vehicle = new Vehicle(v[0], v[1], v[2], Vehicle.VehicleType.MONTHLY);
            vehicleRepository.save(vehicle);
        }

        List<ParkingSpot> allSpots = parkingSpotRepository.findAll();
        int spotIndex = 0;
        for (String[] v : monthlyVehicles) {
            ParkingSpot spot = allSpots.get(spotIndex++);
            MonthlyRental rental = new MonthlyRental();
            rental.setPlateNumber(v[0]);
            rental.setSpotId(spot.getId());
            rental.setStartDate(LocalDate.now().minusDays(15));
            rental.setEndDate(LocalDate.now().plusMonths(1));
            rental.setAmount(300.0);
            rental.setStatus(MonthlyRental.RentalStatus.ACTIVE);
            rental.setCreatedAt(LocalDateTime.now());
            monthlyRentalRepository.save(rental);

            spot.setStatus(ParkingSpot.SpotStatus.OCCUPIED);
            spot.setPlateNumber(v[0]);
            parkingSpotRepository.save(spot);
        }

        String[] parkedPlates = {"京A12345", "京B23456", "沪C34567"};
        for (String plate : parkedPlates) {
            ParkingSpot spot = allSpots.get(spotIndex++);
            spot.setStatus(ParkingSpot.SpotStatus.OCCUPIED);
            spot.setPlateNumber(plate);
            parkingSpotRepository.save(spot);

            EntryExitRecord record = new EntryExitRecord();
            record.setPlateNumber(plate);
            record.setSpotId(spot.getId());
            record.setEntryTime(LocalDateTime.now().minusHours(2).plusMinutes((long) (Math.random() * 60)));
            record.setStatus(EntryExitRecord.RecordStatus.PARKING);
            record.setCreatedAt(LocalDateTime.now());
            entryExitRecordRepository.save(record);
        }

        EntryExitRecord completedRecord = new EntryExitRecord();
        completedRecord.setPlateNumber("粤D45678");
        completedRecord.setSpotId(allSpots.get(spotIndex).getId());
        completedRecord.setEntryTime(LocalDateTime.now().minusHours(5));
        completedRecord.setExitTime(LocalDateTime.now().minusHours(1));
        completedRecord.setDuration(240L);
        completedRecord.setStatus(EntryExitRecord.RecordStatus.COMPLETED);
        completedRecord.setCreatedAt(LocalDateTime.now());
        entryExitRecordRepository.save(completedRecord);

        BillingRule rule = new BillingRule();
        rule.setType("standard");
        rule.setFirstHourFee(5.0);
        rule.setAdditionalHourFee(3.0);
        rule.setDailyMaxFee(50.0);
        rule.setMonthlyFee(300.0);
        billingRuleRepository.save(rule);

        for (String floor : new String[]{"A1F", "B1F"}) {
            HardwareDevice camera = new HardwareDevice();
            camera.setType(HardwareDevice.DeviceType.CAMERA);
            camera.setLocation(floor + " 入口");
            camera.setStatus(HardwareDevice.DeviceStatus.ONLINE);
            camera.setLastHeartbeat(LocalDateTime.now());
            camera.setIpAddress("192.168.1." + (hardwareDeviceRepository.count() + 1));
            camera.setCreatedAt(LocalDateTime.now());
            hardwareDeviceRepository.save(camera);

            HardwareDevice gate = new HardwareDevice();
            gate.setType(HardwareDevice.DeviceType.GATE);
            gate.setLocation(floor + " 闸机");
            gate.setStatus(HardwareDevice.DeviceStatus.ONLINE);
            gate.setLastHeartbeat(LocalDateTime.now());
            gate.setIpAddress("192.168.1." + (hardwareDeviceRepository.count() + 1));
            gate.setCreatedAt(LocalDateTime.now());
            hardwareDeviceRepository.save(gate);
        }

        for (int i = 0; i < Math.min(10, allSpots.size()); i++) {
            HardwareDevice sensor = new HardwareDevice();
            sensor.setType(HardwareDevice.DeviceType.SENSOR);
            sensor.setLocation(allSpots.get(i).getSpotNumber());
            sensor.setStatus(HardwareDevice.DeviceStatus.ONLINE);
            sensor.setLastHeartbeat(LocalDateTime.now());
            sensor.setIpAddress("192.168.2." + (i + 1));
            sensor.setCreatedAt(LocalDateTime.now());
            hardwareDeviceRepository.save(sensor);
        }

        String[][] configs = {
            {"parking.name", "智慧停车管理系统", "系统名称"},
            {"parking.open_time", "00:00", "开园时间"},
            {"parking.close_time", "23:59", "闭园时间"},
            {"parking.free_minutes", "15", "免费停车时长(分钟)"},
            {"alert.overdue_hours", "24", "超时告警小时数"},
            {"monthly.expire_remind_days", "7", "月租到期提前提醒天数"}
        };
        for (String[] c : configs) {
            SystemConfig config = new SystemConfig();
            config.setConfigKey(c[0]);
            config.setConfigValue(c[1]);
            config.setDescription(c[2]);
            config.setUpdatedAt(LocalDateTime.now());
            systemConfigRepository.save(config);
        }
    }
}
