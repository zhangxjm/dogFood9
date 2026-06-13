package com.smartgrid.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "reactive_compensation_task")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReactiveCompensationTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String taskId;

    private String deviceId;

    private String compensationType;

    private Double targetReactivePower;

    private Double currentReactivePower;

    private Double compensationValue;

    private Double targetPowerFactor;

    private String status;

    private LocalDateTime createdAt;

    private LocalDateTime completedAt;
}
