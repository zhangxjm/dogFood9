package com.smartparking.service;

import com.smartparking.entity.HardwareDevice;
import com.smartparking.repository.HardwareDeviceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class HardwareService {

    @Autowired
    private HardwareDeviceRepository hardwareDeviceRepository;

    public List<HardwareDevice> listDevices() {
        return hardwareDeviceRepository.findAll();
    }

    public HardwareDevice getDeviceById(Long id) {
        return hardwareDeviceRepository.findById(id).orElse(null);
    }

    @Transactional
    public HardwareDevice updateDeviceStatus(Long id, HardwareDevice.DeviceStatus status) {
        HardwareDevice device = hardwareDeviceRepository.findById(id).orElse(null);
        if (device == null) {
            return null;
        }
        device.setStatus(status);
        if (status == HardwareDevice.DeviceStatus.ONLINE) {
            device.setLastHeartbeat(LocalDateTime.now());
        }
        return hardwareDeviceRepository.save(device);
    }

    public Map<String, Object> sendCommand(Long deviceId, String command) {
        HardwareDevice device = hardwareDeviceRepository.findById(deviceId).orElse(null);
        if (device == null) {
            return Map.of("success", false, "message", "设备不存在");
        }
        if (device.getStatus() != HardwareDevice.DeviceStatus.ONLINE) {
            return Map.of("success", false, "message", "设备不在线，无法发送指令");
        }
        return Map.of("success", true, "message", "指令已发送", "command", command);
    }

    @Transactional
    public Map<String, Object> triggerReconnect(Long deviceId) {
        HardwareDevice device = hardwareDeviceRepository.findById(deviceId).orElse(null);
        if (device == null) {
            return Map.of("success", false, "message", "设备不存在");
        }
        device.setLastHeartbeat(LocalDateTime.now());
        device.setStatus(HardwareDevice.DeviceStatus.ONLINE);
        hardwareDeviceRepository.save(device);
        return Map.of("success", true, "message", "重连指令已发送");
    }

    @Transactional
    public void updateHeartbeat(Long deviceId) {
        HardwareDevice device = hardwareDeviceRepository.findById(deviceId).orElse(null);
        if (device != null) {
            device.setLastHeartbeat(LocalDateTime.now());
            hardwareDeviceRepository.save(device);
        }
    }

    public List<HardwareDevice> findOfflineDevices() {
        return hardwareDeviceRepository.findByStatus(HardwareDevice.DeviceStatus.OFFLINE);
    }
}
