package com.smartparking.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "parking_spot")
public class ParkingSpot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long lotId;
    private String floor;
    private String zone;
    private String spotNumber;
    @Enumerated(EnumType.STRING)
    private SpotStatus status;
    private String plateNumber;
    private LocalDateTime updatedAt;

    public enum SpotStatus {
        FREE, OCCUPIED, RESERVED, MAINTENANCE
    }

    public ParkingSpot() {}

    public ParkingSpot(Long lotId, String floor, String zone, String spotNumber) {
        this.lotId = lotId;
        this.floor = floor;
        this.zone = zone;
        this.spotNumber = spotNumber;
        this.status = SpotStatus.FREE;
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getLotId() { return lotId; }
    public void setLotId(Long lotId) { this.lotId = lotId; }
    public String getFloor() { return floor; }
    public void setFloor(String floor) { this.floor = floor; }
    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }
    public String getSpotNumber() { return spotNumber; }
    public void setSpotNumber(String spotNumber) { this.spotNumber = spotNumber; }
    public SpotStatus getStatus() { return status; }
    public void setStatus(SpotStatus status) { this.status = status; this.updatedAt = LocalDateTime.now(); }
    public String getPlateNumber() { return plateNumber; }
    public void setPlateNumber(String plateNumber) { this.plateNumber = plateNumber; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
