package com.smartparking.service;

import com.smartparking.entity.MonthlyRental;
import com.smartparking.repository.MonthlyRentalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class MonthlyRentalService {

    @Autowired
    private MonthlyRentalRepository monthlyRentalRepository;

    @Transactional
    public MonthlyRental createRental(MonthlyRental rental) {
        rental.setStatus(MonthlyRental.RentalStatus.ACTIVE);
        rental.setCreatedAt(LocalDateTime.now());
        return monthlyRentalRepository.save(rental);
    }

    @Transactional
    public MonthlyRental renewRental(Long id, int months) {
        MonthlyRental rental = monthlyRentalRepository.findById(id).orElse(null);
        if (rental == null) {
            return null;
        }
        LocalDate currentEnd = rental.getEndDate();
        if (currentEnd.isBefore(LocalDate.now())) {
            currentEnd = LocalDate.now();
        }
        rental.setEndDate(currentEnd.plusMonths(months));
        rental.setStatus(MonthlyRental.RentalStatus.ACTIVE);
        return monthlyRentalRepository.save(rental);
    }

    public List<MonthlyRental> listRentals() {
        return monthlyRentalRepository.findByStatus(MonthlyRental.RentalStatus.ACTIVE);
    }

    public List<MonthlyRental> findExpiringRentals() {
        LocalDate now = LocalDate.now();
        LocalDate sevenDaysLater = now.plusDays(7);
        return monthlyRentalRepository.findByEndDateBetween(now, sevenDaysLater);
    }

    public boolean hasActiveRental(String plateNumber) {
        return monthlyRentalRepository.findByPlateNumberAndStatus(plateNumber, MonthlyRental.RentalStatus.ACTIVE).isPresent();
    }

    @Transactional
    public void expireRentals() {
        List<MonthlyRental> expired = monthlyRentalRepository.findByEndDateBeforeAndStatus(
                LocalDate.now(), MonthlyRental.RentalStatus.ACTIVE);
        for (MonthlyRental rental : expired) {
            rental.setStatus(MonthlyRental.RentalStatus.EXPIRED);
            monthlyRentalRepository.save(rental);
        }
    }
}
