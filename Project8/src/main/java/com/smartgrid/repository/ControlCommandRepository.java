package com.smartgrid.repository;

import com.smartgrid.entity.ControlCommand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ControlCommandRepository extends JpaRepository<ControlCommand, Long> {

    List<ControlCommand> findByStatus(String status);

    List<ControlCommand> findByTargetDeviceIdOrderByCreatedAtDesc(String targetDeviceId);
}
