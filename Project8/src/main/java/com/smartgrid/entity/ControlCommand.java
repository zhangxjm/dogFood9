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
import javax.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "control_command")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ControlCommand {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String commandId;

    private String targetDeviceId;

    private String commandType;

    private Double parameterValue;

    private Integer priority;

    private Boolean requireAck = true;

    private String status;

    private String result;

    private String sessionId;

    private LocalDateTime createdAt;

    private LocalDateTime executedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
