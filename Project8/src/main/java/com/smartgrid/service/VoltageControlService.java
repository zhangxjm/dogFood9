package com.smartgrid.service;

import com.smartgrid.entity.AlarmRecord;
import com.smartgrid.entity.GridDevice;
import com.smartgrid.entity.GridStatusRecord;
import com.smartgrid.netty.DeviceSessionManager;
import com.smartgrid.netty.GridServerHandler;
import com.smartgrid.repository.AlarmRecordRepository;
import com.smartgrid.repository.GridDeviceRepository;
import com.smartgrid.repository.GridStatusRecordRepository;
import com.smartgrid.rpc.protobuf.GridProtocol;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
public class VoltageControlService {

    private final GridDeviceRepository gridDeviceRepository;
    private final GridStatusRecordRepository gridStatusRecordRepository;
    private final AlarmRecordRepository alarmRecordRepository;
    private final DistributedLockService distributedLockService;
    private final DeviceSessionManager deviceSessionManager;
    private final GridServerHandler gridServerHandler;

    @Value("${grid.voltage.lower-limit:198}")
    private double voltageMin;

    @Value("${grid.voltage.upper-limit:242}")
    private double voltageMax;

    public VoltageControlService(GridDeviceRepository gridDeviceRepository,
                                 GridStatusRecordRepository gridStatusRecordRepository,
                                 AlarmRecordRepository alarmRecordRepository,
                                 DistributedLockService distributedLockService,
                                 DeviceSessionManager deviceSessionManager,
                                 GridServerHandler gridServerHandler) {
        this.gridDeviceRepository = gridDeviceRepository;
        this.gridStatusRecordRepository = gridStatusRecordRepository;
        this.alarmRecordRepository = alarmRecordRepository;
        this.distributedLockService = distributedLockService;
        this.deviceSessionManager = deviceSessionManager;
        this.gridServerHandler = gridServerHandler;
    }

    public void checkVoltageStability() {
        List<GridDevice> onlineDevices = gridDeviceRepository.findByStatus("ONLINE");
        for (GridDevice device : onlineDevices) {
            Double voltage = device.getCurrentVoltage();
            if (voltage != null && (voltage < voltageMin || voltage > voltageMax)) {
                log.warn("Device {} voltage {} out of range [{}, {}]", device.getDeviceId(), voltage, voltageMin, voltageMax);
                regulateVoltage(device.getDeviceId());
            }
        }
    }

    public void regulateVoltage(String deviceId) {
        distributedLockService.executeWithLock("voltage:regulation:" + deviceId, 3, 10, java.util.concurrent.TimeUnit.SECONDS, () -> {
            GridDevice device = gridDeviceRepository.findByDeviceId(deviceId).orElse(null);
            if (device == null) {
                log.warn("Device {} not found for voltage regulation", deviceId);
                return;
            }

            Double currentVoltage = device.getCurrentVoltage();
            if (currentVoltage == null) {
                return;
            }

            double targetVoltage = 220.0;
            double regulationStep = targetVoltage - currentVoltage;

            GridProtocol.VoltageRegulationPayload payload = GridProtocol.VoltageRegulationPayload.newBuilder()
                    .setRegulationId(UUID.randomUUID().toString())
                    .setDeviceId(deviceId)
                    .setTargetVoltage(targetVoltage)
                    .setCurrentVoltage(currentVoltage)
                    .setRegulationStep(regulationStep)
                    .setRegulationMode("AUTO")
                    .build();

            GridProtocol.GridMessage message = GridProtocol.GridMessage.newBuilder()
                    .setType(GridProtocol.MessageType.VOLTAGE_REGULATION)
                    .setDeviceId(deviceId)
                    .setTimestamp(System.currentTimeMillis())
                    .setVoltageRegulation(payload)
                    .build();

            gridServerHandler.sendCommand(deviceId, message);
            log.info("Sent voltage regulation command to device {}: target={}, step={}", deviceId, targetVoltage, regulationStep);

            if (currentVoltage < voltageMin - 20 || currentVoltage > voltageMax + 20) {
                AlarmRecord alarm = new AlarmRecord();
                alarm.setAlarmId(UUID.randomUUID().toString());
                alarm.setLevel("CRITICAL");
                alarm.setSource("VOLTAGE_CONTROL");
                alarm.setMessage("Device " + deviceId + " critical voltage: " + currentVoltage + "V");
                alarm.setThresholdValue(currentVoltage < voltageMin ? voltageMin : voltageMax);
                alarm.setActualValue(currentVoltage);
                alarm.setDeviceId(deviceId);
                alarm.setCreatedAt(LocalDateTime.now());
                alarmRecordRepository.save(alarm);
            }
        });
    }

    public Map<String, Object> getVoltageOverview() {
        List<GridDevice> onlineDevices = gridDeviceRepository.findByStatus("ONLINE");
        Map<String, Object> overview = new HashMap<>();
        List<Map<String, Object>> deviceVoltageList = new ArrayList<>();
        double sum = 0;
        double min = Double.MAX_VALUE;
        double max = Double.MIN_VALUE;
        int outOfRangeCount = 0;
        int count = 0;

        for (GridDevice device : onlineDevices) {
            Double voltage = device.getCurrentVoltage();
            if (voltage != null) {
                Map<String, Object> item = new HashMap<>();
                item.put("deviceId", device.getDeviceId());
                item.put("deviceName", device.getDeviceName());
                item.put("currentVoltage", voltage);
                boolean outOfRange = voltage < voltageMin || voltage > voltageMax;
                item.put("outOfRange", outOfRange);
                deviceVoltageList.add(item);
                sum += voltage;
                min = Math.min(min, voltage);
                max = Math.max(max, voltage);
                count++;
                if (outOfRange) {
                    outOfRangeCount++;
                }
            }
        }

        overview.put("deviceVoltages", deviceVoltageList);
        overview.put("averageVoltage", count > 0 ? sum / count : 0);
        overview.put("minVoltage", count > 0 ? min : 0);
        overview.put("maxVoltage", count > 0 ? max : 0);
        overview.put("outOfRangeCount", outOfRangeCount);
        return overview;
    }

    public void recordDeviceStatus(GridDevice device) {
        GridStatusRecord record = new GridStatusRecord();
        record.setDeviceId(device.getDeviceId());
        record.setVoltageA(device.getCurrentVoltage());
        record.setActivePower(device.getCurrentActivePower());
        record.setReactivePower(device.getCurrentReactivePower());
        record.setPowerFactor(device.getPowerFactor());
        record.setFrequency(device.getFrequency());
        record.setTemperature(device.getTemperature());
        record.setCompensationCapacity(device.getCompensationCapacity());
        record.setLoadRate(device.getLoadRate());
        record.setRecordTime(LocalDateTime.now());
        gridStatusRecordRepository.save(record);
    }
}
