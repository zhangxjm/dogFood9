package com.smartgrid.controller;

import com.smartgrid.entity.GridDevice;
import com.smartgrid.repository.GridDeviceRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/devices")
@Slf4j
public class GridDeviceController {

    private final GridDeviceRepository gridDeviceRepository;

    public GridDeviceController(GridDeviceRepository gridDeviceRepository) {
        this.gridDeviceRepository = gridDeviceRepository;
    }

    @GetMapping
    public List<GridDevice> listAll() {
        return gridDeviceRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<GridDevice> getById(@PathVariable Long id) {
        return gridDeviceRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/type/{type}")
    public List<GridDevice> getByType(@PathVariable String type) {
        return gridDeviceRepository.findByDeviceType(type);
    }

    @GetMapping("/status/{status}")
    public List<GridDevice> getByStatus(@PathVariable String status) {
        return gridDeviceRepository.findByStatus(status);
    }

    @GetMapping("/substation/{name}")
    public List<GridDevice> getBySubstation(@PathVariable String name) {
        return gridDeviceRepository.findBySubstationName(name);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<GridDevice> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return gridDeviceRepository.findById(id)
                .map(device -> {
                    device.setStatus(body.get("status"));
                    gridDeviceRepository.save(device);
                    return ResponseEntity.ok(device);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
