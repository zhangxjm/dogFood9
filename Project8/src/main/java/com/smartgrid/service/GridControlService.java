package com.smartgrid.service;

import com.smartgrid.entity.AlarmRecord;
import com.smartgrid.entity.ControlCommand;
import com.smartgrid.entity.GridDevice;
import com.smartgrid.netty.GridServerHandler;
import com.smartgrid.repository.AlarmRecordRepository;
import com.smartgrid.repository.ControlCommandRepository;
import com.smartgrid.repository.GridDeviceRepository;
import com.smartgrid.rpc.protobuf.GridProtocol;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
public class GridControlService {

    private final VoltageControlService voltageControlService;
    private final ReactivePowerService reactivePowerService;
    private final NewEnergyService newEnergyService;
    private final GridDeviceRepository gridDeviceRepository;
    private final AlarmRecordRepository alarmRecordRepository;
    private final ControlCommandRepository controlCommandRepository;
    private final DistributedLockService distributedLockService;
    private final GridServerHandler gridServerHandler;

    public GridControlService(VoltageControlService voltageControlService,
                              ReactivePowerService reactivePowerService,
                              NewEnergyService newEnergyService,
                              GridDeviceRepository gridDeviceRepository,
                              AlarmRecordRepository alarmRecordRepository,
                              ControlCommandRepository controlCommandRepository,
                              DistributedLockService distributedLockService,
                              GridServerHandler gridServerHandler) {
        this.voltageControlService = voltageControlService;
        this.reactivePowerService = reactivePowerService;
        this.newEnergyService = newEnergyService;
        this.gridDeviceRepository = gridDeviceRepository;
        this.alarmRecordRepository = alarmRecordRepository;
        this.controlCommandRepository = controlCommandRepository;
        this.distributedLockService = distributedLockService;
        this.gridServerHandler = gridServerHandler;
    }

    public void performFullControlCycle() {
        log.info("Starting full control cycle");
        voltageControlService.checkVoltageStability();
        reactivePowerService.optimizeReactivePower();
        newEnergyService.adaptNewEnergyIntegration();
        log.info("Full control cycle completed");
    }

    public ControlCommand sendControlCommand(String deviceId, String commandType, double paramValue) {
        return distributedLockService.executeWithLock("command:" + deviceId, 3, 10, java.util.concurrent.TimeUnit.SECONDS, () -> {
            ControlCommand command = new ControlCommand();
            command.setCommandId(UUID.randomUUID().toString());
            command.setTargetDeviceId(deviceId);
            command.setCommandType(commandType);
            command.setParameterValue(paramValue);
            command.setPriority(1);
            command.setRequireAck(true);
            command.setStatus("PENDING");
            controlCommandRepository.save(command);

            GridProtocol.ControlCommandPayload payload = GridProtocol.ControlCommandPayload.newBuilder()
                    .setCommandId(command.getCommandId())
                    .setTargetDeviceId(deviceId)
                    .setCommandType(commandType)
                    .setParameterValue(paramValue)
                    .setPriority(1)
                    .setRequireAck(true)
                    .build();

            GridProtocol.GridMessage message = GridProtocol.GridMessage.newBuilder()
                    .setType(GridProtocol.MessageType.CONTROL_COMMAND)
                    .setDeviceId(deviceId)
                    .setTimestamp(System.currentTimeMillis())
                    .setControlCommand(payload)
                    .build();

            gridServerHandler.sendCommand(deviceId, message);
            log.info("Sent control command to device {}: type={}, param={}", deviceId, commandType, paramValue);
            return command;
        });
    }

    public Map<String, Object> getSystemOverview() {
        Map<String, Object> overview = new HashMap<>();

        List<GridDevice> allDevices = gridDeviceRepository.findAll();
        List<GridDevice> onlineDevices = gridDeviceRepository.findByStatus("ONLINE");

        overview.put("totalDeviceCount", allDevices.size());
        overview.put("onlineDeviceCount", onlineDevices.size());
        overview.put("voltageStats", voltageControlService.getVoltageOverview());
        overview.put("reactivePowerStats", reactivePowerService.getReactivePowerOverview());
        overview.put("newEnergyStats", newEnergyService.getNewEnergyOverview());
        overview.put("criticalAlarmCount", alarmRecordRepository.countByLevelAndAcknowledgedFalse("CRITICAL"));
        overview.put("warningAlarmCount", alarmRecordRepository.countByLevelAndAcknowledgedFalse("WARNING"));
        overview.put("unacknowledgedAlarmCount", alarmRecordRepository.countByLevelAndAcknowledgedFalse("INFO"));

        return overview;
    }

    public void acknowledgeAlarm(Long alarmId) {
        alarmRecordRepository.findById(alarmId).ifPresent(alarm -> {
            alarm.setAcknowledged(true);
            alarm.setAcknowledgedAt(LocalDateTime.now());
            alarmRecordRepository.save(alarm);
            log.info("Alarm {} acknowledged", alarmId);
        });
    }
}
