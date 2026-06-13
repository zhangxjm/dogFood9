package com.smartgrid.service;

import com.smartgrid.entity.GridDevice;
import com.smartgrid.entity.GridStatusRecord;
import com.smartgrid.entity.NewEnergyStatus;
import com.smartgrid.netty.SimulateDeviceService;
import com.smartgrid.repository.GridDeviceRepository;
import com.smartgrid.repository.GridStatusRecordRepository;
import com.smartgrid.repository.NewEnergyStatusRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
@Slf4j
@EnableScheduling
public class DataSimulatorService implements CommandLineRunner {

    private final GridDeviceRepository gridDeviceRepository;
    private final GridStatusRecordRepository gridStatusRecordRepository;
    private final NewEnergyStatusRepository newEnergyStatusRepository;
    private final SimulateDeviceService simulateDeviceService;
    private final VoltageControlService voltageControlService;
    private final GridControlService gridControlService;

    public DataSimulatorService(GridDeviceRepository gridDeviceRepository,
                                GridStatusRecordRepository gridStatusRecordRepository,
                                NewEnergyStatusRepository newEnergyStatusRepository,
                                SimulateDeviceService simulateDeviceService,
                                VoltageControlService voltageControlService,
                                GridControlService gridControlService) {
        this.gridDeviceRepository = gridDeviceRepository;
        this.gridStatusRecordRepository = gridStatusRecordRepository;
        this.newEnergyStatusRepository = newEnergyStatusRepository;
        this.simulateDeviceService = simulateDeviceService;
        this.voltageControlService = voltageControlService;
        this.gridControlService = gridControlService;
    }

    @Override
    public void run(String... args) {
        simulateInitialDevices();
        simulateInitialNewEnergyStatus();
        log.info("Data initialization completed");
    }

    @Scheduled(fixedRate = 5000)
    public void simulateData() {
        List<GridDevice> onlineDevices = gridDeviceRepository.findByStatus("ONLINE");
        for (GridDevice device : onlineDevices) {
            ThreadLocalRandom r = ThreadLocalRandom.current();
            double voltage = 210 + r.nextDouble() * 20;
            double activePower = 50 + r.nextDouble() * 150;
            double reactivePower = 10 + r.nextDouble() * 80;
            double powerFactor = 0.85 + r.nextDouble() * 0.13;
            double frequency = 49.95 + r.nextDouble() * 0.10;
            double temperature = 35 + r.nextDouble() * 30;
            double loadRate = r.nextDouble() * 100;
            double compensationCapacity = r.nextDouble() * 50;

            device.setCurrentVoltage(voltage);
            device.setCurrentActivePower(activePower);
            device.setCurrentReactivePower(reactivePower);
            device.setPowerFactor(powerFactor);
            device.setFrequency(frequency);
            device.setTemperature(temperature);
            device.setLoadRate(loadRate);
            device.setCompensationCapacity(compensationCapacity);
            device.setLastHeartbeat(LocalDateTime.now());
            gridDeviceRepository.save(device);

            voltageControlService.recordDeviceStatus(device);
        }

        updateNewEnergyStatus();
    }

    @Scheduled(fixedRate = 10000)
    public void triggerControlCycle() {
        try {
            gridControlService.performFullControlCycle();
        } catch (Exception e) {
            log.error("Control cycle error", e);
        }
    }

    private void updateNewEnergyStatus() {
        List<NewEnergyStatus> statuses = newEnergyStatusRepository.findAll();
        for (NewEnergyStatus status : statuses) {
            double output = simulateDeviceService.simulateNewEnergyOutput(status.getEnergyType());
            status.setCurrentOutput(output);
            status.setGridLoad(200 + ThreadLocalRandom.current().nextDouble() * 300);
            double load = status.getGridLoad() != null ? status.getGridLoad() : 200;
            status.setPenetrationRate(load > 0 ? output / load : 0);
            status.setStatus("RUNNING");
            status.setUpdatedAt(LocalDateTime.now());
            newEnergyStatusRepository.save(status);
        }
    }

    private void simulateInitialDevices() {
        if (gridDeviceRepository.count() > 0) {
            return;
        }

        List<GridDevice> devices = new ArrayList<>();

        devices.add(createDevice("DEV-TF-001", "1号主变压器", "TRANSFORMER", "220kV变电站", "220kV", 200000.0));
        devices.add(createDevice("DEV-TF-002", "2号主变压器", "TRANSFORMER", "220kV变电站", "220kV", 200000.0));
        devices.add(createDevice("DEV-CB-001", "1号电容器组", "CAPACITOR_BANK", "110kV变电站", "110kV", 30000.0));
        devices.add(createDevice("DEV-CB-002", "2号电容器组", "CAPACITOR_BANK", "110kV变电站", "110kV", 30000.0));
        devices.add(createDevice("DEV-RE-001", "1号电抗器", "REACTOR", "220kV变电站", "220kV", 40000.0));
        devices.add(createDevice("DEV-RE-002", "2号电抗器", "REACTOR", "220kV变电站", "220kV", 40000.0));
        devices.add(createDevice("DEV-SVG-001", "1号SVG", "SVG", "110kV变电站", "110kV", 20000.0));
        devices.add(createDevice("DEV-SVG-002", "2号SVG", "SVG", "110kV变电站", "110kV", 20000.0));
        devices.add(createDevice("DEV-SI-001", "1号光伏逆变器", "SOLAR_INVERTER", "新能源站", "35kV", 500.0));
        devices.add(createDevice("DEV-SI-002", "2号光伏逆变器", "SOLAR_INVERTER", "新能源站", "35kV", 500.0));
        devices.add(createDevice("DEV-WI-001", "1号风电逆变器", "WIND_INVERTER", "风电场", "35kV", 300.0));
        devices.add(createDevice("DEV-WI-002", "2号风电逆变器", "WIND_INVERTER", "风电场", "35kV", 300.0));

        gridDeviceRepository.saveAll(devices);
        log.info("Initialized {} devices", devices.size());
    }

    private void simulateInitialNewEnergyStatus() {
        if (newEnergyStatusRepository.count() > 0) {
            return;
        }

        List<NewEnergyStatus> statuses = new ArrayList<>();

        NewEnergyStatus solar1 = new NewEnergyStatus();
        solar1.setDeviceId("DEV-SI-001");
        solar1.setEnergyType("SOLAR");
        solar1.setCurrentOutput(simulateDeviceService.simulateNewEnergyOutput("SOLAR"));
        solar1.setRatedOutput(500.0);
        solar1.setGridLoad(200.0);
        solar1.setPenetrationRate(0.0);
        solar1.setReserveCapacity(500.0);
        solar1.setStatus("RUNNING");
        solar1.setUpdatedAt(LocalDateTime.now());
        statuses.add(solar1);

        NewEnergyStatus solar2 = new NewEnergyStatus();
        solar2.setDeviceId("DEV-SI-002");
        solar2.setEnergyType("SOLAR");
        solar2.setCurrentOutput(simulateDeviceService.simulateNewEnergyOutput("SOLAR"));
        solar2.setRatedOutput(500.0);
        solar2.setGridLoad(200.0);
        solar2.setPenetrationRate(0.0);
        solar2.setReserveCapacity(500.0);
        solar2.setStatus("RUNNING");
        solar2.setUpdatedAt(LocalDateTime.now());
        statuses.add(solar2);

        NewEnergyStatus wind1 = new NewEnergyStatus();
        wind1.setDeviceId("DEV-WI-001");
        wind1.setEnergyType("WIND");
        wind1.setCurrentOutput(simulateDeviceService.simulateNewEnergyOutput("WIND"));
        wind1.setRatedOutput(300.0);
        wind1.setGridLoad(200.0);
        wind1.setPenetrationRate(0.0);
        wind1.setReserveCapacity(300.0);
        wind1.setStatus("RUNNING");
        wind1.setUpdatedAt(LocalDateTime.now());
        statuses.add(wind1);

        NewEnergyStatus wind2 = new NewEnergyStatus();
        wind2.setDeviceId("DEV-WI-002");
        wind2.setEnergyType("WIND");
        wind2.setCurrentOutput(simulateDeviceService.simulateNewEnergyOutput("WIND"));
        wind2.setRatedOutput(300.0);
        wind2.setGridLoad(200.0);
        wind2.setPenetrationRate(0.0);
        wind2.setReserveCapacity(300.0);
        wind2.setStatus("RUNNING");
        wind2.setUpdatedAt(LocalDateTime.now());
        statuses.add(wind2);

        newEnergyStatusRepository.saveAll(statuses);
        log.info("Initialized {} new energy statuses", statuses.size());
    }

    private GridDevice createDevice(String deviceId, String deviceName, String deviceType,
                                    String substationName, String voltageLevel, Double ratedCapacity) {
        GridDevice device = new GridDevice();
        device.setDeviceId(deviceId);
        device.setDeviceName(deviceName);
        device.setDeviceType(deviceType);
        device.setStatus("ONLINE");
        device.setSubstationName(substationName);
        device.setVoltageLevel(voltageLevel);
        device.setRatedCapacity(ratedCapacity);
        device.setCurrentVoltage(220.0);
        device.setCurrentActivePower(0.0);
        device.setCurrentReactivePower(0.0);
        device.setPowerFactor(0.95);
        device.setFrequency(50.0);
        device.setTemperature(40.0);
        device.setLoadRate(0.0);
        device.setLastHeartbeat(LocalDateTime.now());
        return device;
    }
}
