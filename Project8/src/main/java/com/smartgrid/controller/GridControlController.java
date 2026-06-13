package com.smartgrid.controller;

import com.smartgrid.service.GridControlService;
import com.smartgrid.service.NewEnergyService;
import com.smartgrid.service.ReactivePowerService;
import com.smartgrid.service.VoltageControlService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/control")
@Slf4j
public class GridControlController {

    private final GridControlService gridControlService;
    private final VoltageControlService voltageControlService;
    private final ReactivePowerService reactivePowerService;
    private final NewEnergyService newEnergyService;

    public GridControlController(GridControlService gridControlService,
                                 VoltageControlService voltageControlService,
                                 ReactivePowerService reactivePowerService,
                                 NewEnergyService newEnergyService) {
        this.gridControlService = gridControlService;
        this.voltageControlService = voltageControlService;
        this.reactivePowerService = reactivePowerService;
        this.newEnergyService = newEnergyService;
    }

    @GetMapping("/overview")
    public ResponseEntity<?> getOverview() {
        return ResponseEntity.ok(gridControlService.getSystemOverview());
    }

    @PostMapping("/command")
    public ResponseEntity<?> sendCommand(@RequestBody Map<String, Object> body) {
        String deviceId = (String) body.get("deviceId");
        String commandType = (String) body.get("commandType");
        Double parameterValue = ((Number) body.get("parameterValue")).doubleValue();
        return ResponseEntity.ok(gridControlService.sendControlCommand(deviceId, commandType, parameterValue));
    }

    @PostMapping("/cycle")
    public ResponseEntity<?> triggerCycle() {
        gridControlService.performFullControlCycle();
        return ResponseEntity.ok().build();
    }

    @GetMapping("/voltage")
    public ResponseEntity<?> getVoltageOverview() {
        return ResponseEntity.ok(voltageControlService.getVoltageOverview());
    }

    @GetMapping("/reactive")
    public ResponseEntity<?> getReactivePowerOverview() {
        return ResponseEntity.ok(reactivePowerService.getReactivePowerOverview());
    }

    @GetMapping("/new-energy")
    public ResponseEntity<?> getNewEnergyOverview() {
        return ResponseEntity.ok(newEnergyService.getNewEnergyOverview());
    }
}
