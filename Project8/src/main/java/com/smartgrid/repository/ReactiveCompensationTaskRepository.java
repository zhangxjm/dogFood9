package com.smartgrid.repository;

import com.smartgrid.entity.ReactiveCompensationTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReactiveCompensationTaskRepository extends JpaRepository<ReactiveCompensationTask, Long> {

    List<ReactiveCompensationTask> findByStatusOrderByCreatedAtDesc(String status);
}
