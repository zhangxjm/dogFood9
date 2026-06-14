package com.smartparking.service;

import com.smartparking.entity.AlertEvent;
import com.smartparking.repository.AlertEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AlertService {

    @Autowired
    private AlertEventRepository alertEventRepository;

    @Transactional
    public AlertEvent createAlert(AlertEvent alert) {
        alert.setStatus(AlertEvent.AlertStatus.PENDING);
        alert.setCreatedAt(LocalDateTime.now());
        return alertEventRepository.save(alert);
    }

    @Transactional
    public AlertEvent resolveAlert(Long id) {
        AlertEvent alert = alertEventRepository.findById(id).orElse(null);
        if (alert == null) {
            return null;
        }
        alert.setStatus(AlertEvent.AlertStatus.RESOLVED);
        alert.setResolvedAt(LocalDateTime.now());
        return alertEventRepository.save(alert);
    }

    public List<AlertEvent> listAlerts() {
        return alertEventRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<AlertEvent> findByStatus(AlertEvent.AlertStatus status) {
        return alertEventRepository.findByStatus(status);
    }

    public List<AlertEvent> findByType(AlertEvent.AlertType type) {
        return alertEventRepository.findByType(type);
    }

    public long countPendingAlerts() {
        return alertEventRepository.countByStatus(AlertEvent.AlertStatus.PENDING);
    }
}
