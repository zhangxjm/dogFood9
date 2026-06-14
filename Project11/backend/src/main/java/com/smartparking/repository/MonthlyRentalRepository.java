package com.smartparking.repository;

import com.smartparking.entity.MonthlyRental;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MonthlyRentalRepository extends JpaRepository<MonthlyRental, Long> {
    List<MonthlyRental> findByStatus(MonthlyRental.RentalStatus status);
    Optional<MonthlyRental> findByPlateNumberAndStatus(String plateNumber, MonthlyRental.RentalStatus status);
    List<MonthlyRental> findByEndDateBetween(LocalDate start, LocalDate end);
    List<MonthlyRental> findByEndDateBeforeAndStatus(LocalDate date, MonthlyRental.RentalStatus status);
}
