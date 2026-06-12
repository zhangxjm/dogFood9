package com.fraudguard.repository;

import com.fraudguard.entity.SystemStatistics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SystemStatisticsRepository extends JpaRepository<SystemStatistics, Long> {

    Optional<SystemStatistics> findByStatDate(LocalDate statDate);

    List<SystemStatistics> findTop7ByOrderByStatDateDesc();

    List<SystemStatistics> findTop30ByOrderByStatDateDesc();
}
