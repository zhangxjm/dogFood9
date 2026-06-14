package com.smartparking.repository;

import com.smartparking.entity.HardwareDevice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HardwareDeviceRepository extends JpaRepository<HardwareDevice, Long> {
    List<HardwareDevice> findByType(HardwareDevice.DeviceType type);
    List<HardwareDevice> findByStatus(HardwareDevice.DeviceStatus status);
}
