package com.smartgrid.repository;

import com.smartgrid.entity.GridDevice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GridDeviceRepository extends JpaRepository<GridDevice, Long> {

    Optional<GridDevice> findByDeviceId(String deviceId);

    List<GridDevice> findByDeviceType(String deviceType);

    List<GridDevice> findByStatus(String status);

    List<GridDevice> findBySubstationName(String substationName);
}
