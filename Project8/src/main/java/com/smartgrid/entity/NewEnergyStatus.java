package com.smartgrid.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "new_energy_status")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NewEnergyStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String deviceId;

    private String energyType;

    private Double currentOutput;

    private Double ratedOutput;

    private Double gridLoad;

    private Double penetrationRate;

    private String adaptationStrategy;

    private Double reserveCapacity;

    private String status;

    private LocalDateTime updatedAt;
}
