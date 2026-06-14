package com.smartparking.service;

import com.smartparking.entity.ParkingSpot;
import com.smartparking.entity.Reservation;
import com.smartparking.repository.ParkingSpotRepository;
import com.smartparking.repository.ReservationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReservationService {

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private ParkingSpotRepository parkingSpotRepository;

    @Transactional
    public Reservation createReservation(Reservation reservation) {
        ParkingSpot spot = parkingSpotRepository.findById(reservation.getSpotId()).orElse(null);
        if (spot == null) {
            return null;
        }
        if (spot.getStatus() != ParkingSpot.SpotStatus.FREE) {
            List<ParkingSpot> freeSpots = parkingSpotRepository.findByStatus(ParkingSpot.SpotStatus.FREE);
            if (freeSpots.isEmpty()) {
                return null;
            }
            spot = freeSpots.get(0);
            reservation.setSpotId(spot.getId());
        }

        spot.setStatus(ParkingSpot.SpotStatus.RESERVED);
        parkingSpotRepository.save(spot);

        reservation.setStatus(Reservation.ReservationStatus.PENDING);
        reservation.setCreatedAt(LocalDateTime.now());
        return reservationRepository.save(reservation);
    }

    @Transactional
    public boolean cancelReservation(Long id) {
        Reservation reservation = reservationRepository.findById(id).orElse(null);
        if (reservation == null) {
            return false;
        }
        if (reservation.getStatus() == Reservation.ReservationStatus.CANCELLED) {
            return false;
        }

        reservation.setStatus(Reservation.ReservationStatus.CANCELLED);
        reservationRepository.save(reservation);

        ParkingSpot spot = parkingSpotRepository.findById(reservation.getSpotId()).orElse(null);
        if (spot != null && spot.getStatus() == ParkingSpot.SpotStatus.RESERVED) {
            spot.setStatus(ParkingSpot.SpotStatus.FREE);
            spot.setPlateNumber(null);
            parkingSpotRepository.save(spot);
        }
        return true;
    }

    public List<Reservation> listReservations() {
        return reservationRepository.findAll();
    }
}
