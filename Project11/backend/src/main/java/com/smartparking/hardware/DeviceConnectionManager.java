package com.smartparking.hardware;

import com.smartparking.entity.AlertEvent;
import com.smartparking.entity.HardwareDevice;
import com.smartparking.repository.HardwareDeviceRepository;
import com.smartparking.service.AlertService;
import com.smartparking.service.HardwareService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Component
public class DeviceConnectionManager {

    @Autowired
    private HardwareDeviceRepository hardwareDeviceRepository;

    @Autowired
    private HardwareService hardwareService;

    @Autowired
    private AlertService alertService;

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(5);
    private final Map<Long, Integer> reconnectionAttempts = new ConcurrentHashMap<>();
    private static final int MAX_RECONNECTION_ATTEMPTS = 10;
    private static final long INITIAL_RECONNECTION_INTERVAL = 5000;

    public void deviceWentOffline(Long deviceId) {
        HardwareDevice device = hardwareDeviceRepository.findById(deviceId).orElse(null);
        if (device == null) {
            return;
        }
        device.setStatus(HardwareDevice.DeviceStatus.OFFLINE);
        hardwareDeviceRepository.save(device);

        AlertEvent alert = new AlertEvent();
        alert.setType(AlertEvent.AlertType.DEVICE_OFFLINE);
        alert.setDeviceId(deviceId);
        alert.setDescription("设备离线: " + device.getLocation() + " (" + device.getType() + ")");
        alertService.createAlert(alert);

        scheduleReconnection(deviceId);
    }

    private void scheduleReconnection(Long deviceId) {
        int attempt = reconnectionAttempts.getOrDefault(deviceId, 0) + 1;
        if (attempt > MAX_RECONNECTION_ATTEMPTS) {
            reconnectionAttempts.remove(deviceId);
            return;
        }
        reconnectionAttempts.put(deviceId, attempt);

        long interval = INITIAL_RECONNECTION_INTERVAL * (1L << (attempt - 1));

        scheduler.schedule(() -> {
            try {
                HardwareDevice device = hardwareDeviceRepository.findById(deviceId).orElse(null);
                if (device != null && device.getStatus() == HardwareDevice.DeviceStatus.OFFLINE) {
                    device.setStatus(HardwareDevice.DeviceStatus.ONLINE);
                    device.setLastHeartbeat(LocalDateTime.now());
                    hardwareDeviceRepository.save(device);

                    reconnectionAttempts.remove(deviceId);

                    AlertEvent resolveAlert = new AlertEvent();
                    resolveAlert.setType(AlertEvent.AlertType.DEVICE_OFFLINE);
                    resolveAlert.setDeviceId(deviceId);
                    resolveAlert.setDescription("设备已重新连接: " + device.getLocation());
                    resolveAlert.setStatus(AlertEvent.AlertStatus.RESOLVED);
                    resolveAlert.setResolvedAt(LocalDateTime.now());
                    resolveAlert.setCreatedAt(LocalDateTime.now());
                    alertService.createAlert(resolveAlert);
                }
            } catch (Exception e) {
                scheduleReconnection(deviceId);
            }
        }, interval, TimeUnit.MILLISECONDS);
    }

    public void checkHeartbeat(Long deviceId) {
        HardwareDevice device = hardwareDeviceRepository.findById(deviceId).orElse(null);
        if (device == null) {
            return;
        }
        if (device.getLastHeartbeat() != null &&
                device.getLastHeartbeat().isBefore(LocalDateTime.now().minusMinutes(2))) {
            if (device.getStatus() == HardwareDevice.DeviceStatus.ONLINE) {
                deviceWentOffline(deviceId);
            }
        }
    }

    public void updateHeartbeat(Long deviceId) {
        hardwareService.updateHeartbeat(deviceId);
        reconnectionAttempts.remove(deviceId);
    }
}
