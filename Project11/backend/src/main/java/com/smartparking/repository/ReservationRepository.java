package com.smartparking.repository;

import com.smartparking.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByPlateNumberOrderByCreatedAtDesc(String plateNumber);
    List<Reservation> findByStatus(Reservation.ReservationStatus status);
    List<Reservation> findBySpotIdAndStatus(Long spotId, Reservation.ReservationStatus status);
}
