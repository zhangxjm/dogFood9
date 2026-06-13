package com.smartgrid.service;

import com.smartgrid.entity.AlarmRecord;
import com.smartgrid.entity.GridDevice;
import com.smartgrid.entity.ReactiveCompensationTask;
import com.smartgrid.netty.DeviceSessionManager;
import com.smartgrid.netty.GridServerHandler;
import com.smartgrid.repository.AlarmRecordRepository;
import com.smartgrid.repository.GridDeviceRepository;
import com.smartgrid.repository.ReactiveCompensationTaskRepository;
import com.smartgrid.rpc.protobuf.GridProtocol;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
public class ReactivePowerService {

    private static final double TARGET_POWER_FACTOR = 0.95;

    private final GridDeviceRepository gridDeviceRepository;
    private final ReactiveCompensationTaskRepository reactiveCompensationTaskRepository;
    private final AlarmRecordRepository alarmRecordRepository;
    private final DistributedLockService distributedLockService;
    private final DeviceSessionManager deviceSessionManager;
    private final GridServerHandler gridServerHandler;

    public ReactivePowerService(GridDeviceRepository gridDeviceRepository,
                                ReactiveCompensationTaskRepository reactiveCompensationTaskRepository,
                                AlarmRecordRepository alarmRecordRepository,
                                DistributedLockService distributedLockService,
                                DeviceSessionManager deviceSessionManager,
                                GridServerHandler gridServerHandler) {
        this.gridDeviceRepository = gridDeviceRepository;
        this.reactiveCompensationTaskRepository = reactiveCompensationTaskRepository;
        this.alarmRecordRepository = alarmRecordRepository;
        this.distributedLockService = distributedLockService;
        this.deviceSessionManager = deviceSessionManager;
        this.gridServerHandler = gridServerHandler;
    }

    public void optimizeReactivePower() {
        List<GridDevice> onlineDevices = gridDeviceRepository.findByStatus("ONLINE");
        for (GridDevice device : onlineDevices) {
            Double powerFactor = device.getPowerFactor();
            if (powerFactor != null && powerFactor < TARGET_POWER_FACTOR) {
                log.info("Device {} power factor {} below target {}, triggering compensation",
                        device.getDeviceId(), powerFactor, TARGET_POWER_FACTOR);
                compensateReactivePower(device.getDeviceId());
            }
        }
    }

    public void compensateReactivePower(String deviceId) {
        distributedLockService.executeWithLock("reactive:compensation:" + deviceId, 3, 10, java.util.concurrent.TimeUnit.SECONDS, () -> {
            GridDevice device = gridDeviceRepository.findByDeviceId(deviceId).orElse(null);
            if (device == null) {
                log.warn("Device {} not found for reactive power compensation", deviceId);
                return;
            }

            Double currentReactive = device.getCurrentReactivePower();
            Double currentPF = device.getPowerFactor();
            if (currentReactive == null || currentPF == null || currentPF <= 0) {
                return;
            }

            double compensationValue = calculateCompensationValue(currentReactive, TARGET_POWER_FACTOR, currentPF);
            double targetReactivePower = currentReactive - compensationValue;

            ReactiveCompensationTask task = new ReactiveCompensationTask();
            task.setTaskId(UUID.randomUUID().toString());
            task.setDeviceId(deviceId);
            task.setCompensationType("CAPACITIVE");
            task.setTargetReactivePower(targetReactivePower);
            task.setCurrentReactivePower(currentReactive);
            task.setCompensationValue(compensationValue);
            task.setTargetPowerFactor(TARGET_POWER_FACTOR);
            task.setStatus("PENDING");
            task.setCreatedAt(LocalDateTime.now());
            reactiveCompensationTaskRepository.save(task);

            GridProtocol.ReactiveCompensationPayload payload = GridProtocol.ReactiveCompensationPayload.newBuilder()
                    .setCompensationId(task.getTaskId())
                    .setDeviceId(deviceId)
                    .setTargetReactivePower(targetReactivePower)
                    .setCurrentReactivePower(currentReactive)
                    .setCompensationValue(compensationValue)
                    .setCompensationType("CAPACITIVE")
                    .setTargetPowerFactor(TARGET_POWER_FACTOR)
                    .build();

            GridProtocol.GridMessage message = GridProtocol.GridMessage.newBuilder()
                    .setType(GridProtocol.MessageType.REACTIVE_COMPENSATION)
                    .setDeviceId(deviceId)
                    .setTimestamp(System.currentTimeMillis())
                    .setReactiveCompensation(payload)
                    .build();

            gridServerHandler.sendCommand(deviceId, message);
            log.info("Sent reactive compensation command to device {}: compensation={}", deviceId, compensationValue);
        });
    }

    public Map<String, Object> getReactivePowerOverview() {
        List<GridDevice> onlineDevices = gridDeviceRepository.findByStatus("ONLINE");
        Map<String, Object> overview = new HashMap<>();
        List<Map<String, Object>> deviceDataList = new ArrayList<>();
        double pfSum = 0;
        double totalCompensationNeeded = 0;
        int pfCount = 0;

        for (GridDevice device : onlineDevices) {
            Map<String, Object> data = new HashMap<>();
            data.put("deviceId", device.getDeviceId());
            data.put("deviceName", device.getDeviceName());
            if (device.getCurrentReactivePower() != null) {
                data.put("reactivePower", device.getCurrentReactivePower());
            }
            if (device.getPowerFactor() != null) {
                data.put("powerFactor", device.getPowerFactor());
                pfSum += device.getPowerFactor();
                pfCount++;
                if (device.getPowerFactor() < TARGET_POWER_FACTOR && device.getCurrentReactivePower() != null) {
                    totalCompensationNeeded += calculateCompensationValue(
                            device.getCurrentReactivePower(), TARGET_POWER_FACTOR, device.getPowerFactor());
                }
            }
            if (device.getCompensationCapacity() != null) {
                data.put("compensationCapacity", device.getCompensationCapacity());
            }
            deviceDataList.add(data);
        }

        overview.put("deviceData", deviceDataList);
        overview.put("averagePowerFactor", pfCount > 0 ? pfSum / pfCount : 0);
        overview.put("totalCompensationNeeded", totalCompensationNeeded);
        return overview;
    }

    public static double calculateCompensationValue(double currentReactive, double targetPF, double currentPF) {
        if (currentPF <= 0 || currentPF >= 1.0) {
            return 0;
        }
        return currentReactive * (targetPF / currentPF - 1);
    }
}
