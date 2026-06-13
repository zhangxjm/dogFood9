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
@Table(name = "grid_status_record")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GridStatusRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String deviceId;

    private Double voltageA;

    private Double voltageB;

    private Double voltageC;

    private Double currentA;

    private Double currentB;

    private Double currentC;

    private Double activePower;

    private Double reactivePower;

    private Double powerFactor;

    private Double frequency;

    private Double temperature;

    private Double compensationCapacity;

    private Double loadRate;

    private LocalDateTime recordTime;
}
