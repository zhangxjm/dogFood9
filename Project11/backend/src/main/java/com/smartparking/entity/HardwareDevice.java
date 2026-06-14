package com.smartparking.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "hardware_device")
public class HardwareDevice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Enumerated(EnumType.STRING)
    private DeviceType type;
    private String location;
    @Enumerated(EnumType.STRING)
    private DeviceStatus status;
    private LocalDateTime lastHeartbeat;
    private String ipAddress;
    private LocalDateTime createdAt;

    public enum DeviceType {
        CAMERA, GATE, SENSOR
    }

    public enum DeviceStatus {
        ONLINE, OFFLINE, ERROR
    }

    public HardwareDevice() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public DeviceType getType() { return type; }
    public void setType(DeviceType type) { this.type = type; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public DeviceStatus getStatus() { return status; }
    public void setStatus(DeviceStatus status) { this.status = status; }
    public LocalDateTime getLastHeartbeat() { return lastHeartbeat; }
    public void setLastHeartbeat(LocalDateTime lastHeartbeat) { this.lastHeartbeat = lastHeartbeat; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
