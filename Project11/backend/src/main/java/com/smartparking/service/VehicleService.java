package com.smartparking.service;

import com.smartparking.entity.Vehicle;
import com.smartparking.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class VehicleService {

    @Autowired
    private VehicleRepository vehicleRepository;

    @Transactional
    public Vehicle register(Vehicle vehicle) {
        if (vehicleRepository.existsByPlateNumber(vehicle.getPlateNumber())) {
            return null;
        }
        vehicle.setCreatedAt(java.time.LocalDateTime.now());
        return vehicleRepository.save(vehicle);
    }

    public Vehicle findByPlateNumber(String plateNumber) {
        return vehicleRepository.findByPlateNumber(plateNumber).orElse(null);
    }

    public List<Vehicle> listAll() {
        return vehicleRepository.findAll();
    }

    public boolean existsByPlateNumber(String plateNumber) {
        return vehicleRepository.existsByPlateNumber(plateNumber);
    }
}
