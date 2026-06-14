package com.smartparking.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vehicle")
public class Vehicle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true)
    private String plateNumber;
    private String ownerName;
    private String phone;
    @Enumerated(EnumType.STRING)
    private VehicleType type;
    private LocalDateTime createdAt;

    public enum VehicleType {
        TEMPORARY, MONTHLY
    }

    public Vehicle() {}

    public Vehicle(String plateNumber, String ownerName, String phone, VehicleType type) {
        this.plateNumber = plateNumber;
        this.ownerName = ownerName;
        this.phone = phone;
        this.type = type;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPlateNumber() { return plateNumber; }
    public void setPlateNumber(String plateNumber) { this.plateNumber = plateNumber; }
    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public VehicleType getType() { return type; }
    public void setType(VehicleType type) { this.type = type; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
