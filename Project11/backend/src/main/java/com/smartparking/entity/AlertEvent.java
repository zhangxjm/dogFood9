package com.smartparking.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "alert_event")
public class AlertEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Enumerated(EnumType.STRING)
    private AlertType type;
    private Long deviceId;
    private String description;
    @Enumerated(EnumType.STRING)
    private AlertStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;

    public enum AlertType {
        DEVICE_OFFLINE, OVERSTAY, ILLEGAL_PARKING, GATE_ERROR, SPOT_SENSOR_ERROR
    }

    public enum AlertStatus {
        PENDING, RESOLVED
    }

    public AlertEvent() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public AlertType getType() { return type; }
    public void setType(AlertType type) { this.type = type; }
    public Long getDeviceId() { return deviceId; }
    public void setDeviceId(Long deviceId) { this.deviceId = deviceId; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public AlertStatus getStatus() { return status; }
    public void setStatus(AlertStatus status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
}
