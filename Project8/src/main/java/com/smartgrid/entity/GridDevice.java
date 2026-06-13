package com.smartgrid.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.PrePersist;
import javax.persistence.PreUpdate;
import javax.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "grid_device")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GridDevice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String deviceId;

    private String deviceName;

    private String deviceType;

    private String status;

    private String substationName;

    private String voltageLevel;

    private Double ratedCapacity;

    private Double currentVoltage;

    private Double currentActivePower;

    private Double currentReactivePower;

    private Double powerFactor;

    private Double frequency;

    private Double temperature;

    private Double compensationCapacity;

    private Double loadRate;

    private String ipAddress;

    private Integer port;

    private LocalDateTime lastHeartbeat;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
