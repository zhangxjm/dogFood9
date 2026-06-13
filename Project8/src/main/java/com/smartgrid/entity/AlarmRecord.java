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
@Table(name = "alarm_record")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlarmRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String alarmId;

    private String level;

    private String source;

    private String message;

    private Double thresholdValue;

    private Double actualValue;

    private String deviceId;

    private Boolean acknowledged = false;

    private LocalDateTime createdAt;

    private LocalDateTime acknowledgedAt;
}
