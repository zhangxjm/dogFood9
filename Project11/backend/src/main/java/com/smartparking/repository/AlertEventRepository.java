package com.smartparking.repository;

import com.smartparking.entity.AlertEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AlertEventRepository extends JpaRepository<AlertEvent, Long> {
    List<AlertEvent> findByStatus(AlertEvent.AlertStatus status);
    List<AlertEvent> findByType(AlertEvent.AlertType type);
    List<AlertEvent> findAllByOrderByCreatedAtDesc();
    long countByStatus(AlertEvent.AlertStatus status);
}
