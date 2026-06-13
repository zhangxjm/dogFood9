package com.smartgrid.repository;

import com.smartgrid.entity.NewEnergyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NewEnergyStatusRepository extends JpaRepository<NewEnergyStatus, Long> {

    List<NewEnergyStatus> findByEnergyType(String energyType);

    Optional<NewEnergyStatus> findByDeviceId(String deviceId);
}
