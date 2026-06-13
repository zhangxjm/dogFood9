package com.smartgrid.service;

import com.smartgrid.entity.AlarmRecord;
import com.smartgrid.entity.GridDevice;
import com.smartgrid.entity.NewEnergyStatus;
import com.smartgrid.netty.DeviceSessionManager;
import com.smartgrid.netty.GridServerHandler;
import com.smartgrid.repository.AlarmRecordRepository;
import com.smartgrid.repository.GridDeviceRepository;
import com.smartgrid.repository.NewEnergyStatusRepository;
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
public class NewEnergyService {

    private static final double PENETRATION_RATE_THRESHOLD = 0.30;

    private final NewEnergyStatusRepository newEnergyStatusRepository;
    private final GridDeviceRepository gridDeviceRepository;
    private final AlarmRecordRepository alarmRecordRepository;
    private final DistributedLockService distributedLockService;
    private final DeviceSessionManager deviceSessionManager;
    private final GridServerHandler gridServerHandler;

    public NewEnergyService(NewEnergyStatusRepository newEnergyStatusRepository,
                            GridDeviceRepository gridDeviceRepository,
                            AlarmRecordRepository alarmRecordRepository,
                            DistributedLockService distributedLockService,
                            DeviceSessionManager deviceSessionManager,
                            GridServerHandler gridServerHandler) {
        this.newEnergyStatusRepository = newEnergyStatusRepository;
        this.gridDeviceRepository = gridDeviceRepository;
        this.alarmRecordRepository = alarmRecordRepository;
        this.distributedLockService = distributedLockService;
        this.deviceSessionManager = deviceSessionManager;
        this.gridServerHandler = gridServerHandler;
    }

    public void adaptNewEnergyIntegration() {
        double totalNewEnergyOutput = 0;
        double totalLoad = 0;

        List<NewEnergyStatus> energyStatuses = newEnergyStatusRepository.findAll();
        for (NewEnergyStatus status : energyStatuses) {
            if (status.getCurrentOutput() != null) {
                totalNewEnergyOutput += status.getCurrentOutput();
            }
            if (status.getGridLoad() != null) {
                totalLoad += status.getGridLoad();
            }
        }

        if (totalLoad <= 0) {
            return;
        }

        double penetrationRate = calculatePenetrationRate(totalNewEnergyOutput, totalLoad);
        if (penetrationRate > PENETRATION_RATE_THRESHOLD) {
            log.info("New energy penetration rate {} exceeds threshold {}, triggering adaptation",
                    penetrationRate, PENETRATION_RATE_THRESHOLD);
            for (NewEnergyStatus status : energyStatuses) {
                adaptDevice(status.getDeviceId());
            }
        }
    }

    public void adaptDevice(String deviceId) {
        distributedLockService.executeWithLock("newenergy:adaptation:" + deviceId, 3, 10, java.util.concurrent.TimeUnit.SECONDS, () -> {
            NewEnergyStatus energyStatus = newEnergyStatusRepository.findByDeviceId(deviceId).orElse(null);
            if (energyStatus == null) {
                log.warn("New energy status not found for device {}", deviceId);
                return;
            }

            GridDevice device = gridDeviceRepository.findByDeviceId(deviceId).orElse(null);
            if (device == null) {
                return;
            }

            double reserveCapacity = 0;
            if (energyStatus.getCurrentOutput() != null && energyStatus.getRatedOutput() != null) {
                reserveCapacity = energyStatus.getRatedOutput() - energyStatus.getCurrentOutput();
            }

            String strategy = reserveCapacity > 0 ? "REDUCE_OUTPUT" : "INCREASE_RESERVE";

            GridProtocol.NewEnergyAdaptationPayload payload = GridProtocol.NewEnergyAdaptationPayload.newBuilder()
                    .setAdaptationId(UUID.randomUUID().toString())
                    .setDeviceId(deviceId)
                    .setSolarOutput(getSolarTotalOutput())
                    .setWindOutput(getWindTotalOutput())
                    .setGridLoad(energyStatus.getGridLoad() != null ? energyStatus.getGridLoad() : 0)
                    .setPenetrationRate(energyStatus.getPenetrationRate() != null ? energyStatus.getPenetrationRate() : 0)
                    .setAdaptationStrategy(strategy)
                    .setReserveCapacity(reserveCapacity)
                    .build();

            GridProtocol.GridMessage message = GridProtocol.GridMessage.newBuilder()
                    .setType(GridProtocol.MessageType.NEW_ENERGY_ADAPTATION)
                    .setDeviceId(deviceId)
                    .setTimestamp(System.currentTimeMillis())
                    .setNewEnergyAdaptation(payload)
                    .build();

            gridServerHandler.sendCommand(deviceId, message);
            log.info("Sent new energy adaptation command to device {}: strategy={}, reserve={}", deviceId, strategy, reserveCapacity);

            energyStatus.setAdaptationStrategy(strategy);
            energyStatus.setReserveCapacity(reserveCapacity);
            energyStatus.setUpdatedAt(LocalDateTime.now());
            newEnergyStatusRepository.save(energyStatus);
        });
    }

    public Map<String, Object> getNewEnergyOverview() {
        Map<String, Object> overview = new HashMap<>();
        List<NewEnergyStatus> statuses = newEnergyStatusRepository.findAll();

        double solarOutput = 0;
        double windOutput = 0;
        double totalNewEnergy = 0;
        double totalLoad = 0;
        int adaptingCount = 0;

        for (NewEnergyStatus status : statuses) {
            if (status.getCurrentOutput() != null) {
                totalNewEnergy += status.getCurrentOutput();
                if ("SOLAR".equalsIgnoreCase(status.getEnergyType())) {
                    solarOutput += status.getCurrentOutput();
                } else if ("WIND".equalsIgnoreCase(status.getEnergyType())) {
                    windOutput += status.getCurrentOutput();
                }
            }
            if (status.getGridLoad() != null) {
                totalLoad += status.getGridLoad();
            }
            if (status.getAdaptationStrategy() != null) {
                adaptingCount++;
            }
        }

        overview.put("solarOutput", solarOutput);
        overview.put("windOutput", windOutput);
        overview.put("totalNewEnergy", totalNewEnergy);
        overview.put("penetrationRate", totalLoad > 0 ? calculatePenetrationRate(totalNewEnergy, totalLoad) : 0);
        overview.put("adaptingDeviceCount", adaptingCount);
        return overview;
    }

    public double calculatePenetrationRate(double newEnergyOutput, double totalLoad) {
        if (totalLoad <= 0) {
            return 0;
        }
        return newEnergyOutput / totalLoad;
    }

    private double getSolarTotalOutput() {
        List<NewEnergyStatus> solarStatuses = newEnergyStatusRepository.findByEnergyType("SOLAR");
        double total = 0;
        for (NewEnergyStatus s : solarStatuses) {
            if (s.getCurrentOutput() != null) {
                total += s.getCurrentOutput();
            }
        }
        return total;
    }

    private double getWindTotalOutput() {
        List<NewEnergyStatus> windStatuses = newEnergyStatusRepository.findByEnergyType("WIND");
        double total = 0;
        for (NewEnergyStatus s : windStatuses) {
            if (s.getCurrentOutput() != null) {
                total += s.getCurrentOutput();
            }
        }
        return total;
    }
}
