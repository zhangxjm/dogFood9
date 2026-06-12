package com.fraudguard.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "blacklist", indexes = {
    @Index(name = "idx_blacklist_type_value", columnList = "blacklistType,blacklistValue", unique = true),
    @Index(name = "idx_blacklist_enabled", columnList = "enabled")
})
public class Blacklist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 32)
    private String blacklistType;

    @Column(nullable = false, length = 256)
    private String blacklistValue;

    @Column(length = 256)
    private String description;

    @Column(length = 32)
    private String riskLevel;

    @Column(length = 64)
    private String source;

    private Boolean enabled;

    @Column(length = 64)
    private String createdBy;

    private LocalDateTime createdAt;

    private LocalDateTime expiresAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (enabled == null) {
            enabled = true;
        }
        if (riskLevel == null) {
            riskLevel = "HIGH";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
