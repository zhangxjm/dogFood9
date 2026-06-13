package com.smartgrid.netty;

import com.smartgrid.rpc.protobuf.GridProtocol;
import org.springframework.stereotype.Service;

import java.util.Random;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class SimulateDeviceService {

    private final Random random = new Random();

    public GridProtocol.StatusReportPayload simulateDeviceStatus(String deviceId) {
        ThreadLocalRandom r = ThreadLocalRandom.current();
        double voltageA = 210 + r.nextDouble() * 20;
        double voltageB = 210 + r.nextDouble() * 20;
        double voltageC = 210 + r.nextDouble() * 20;
        double currentA = 50 + r.nextDouble() * 150;
        double currentB = 50 + r.nextDouble() * 150;
        double currentC = 50 + r.nextDouble() * 150;
        double activePower = voltageA * currentA * 0.9 / 1000;
        double reactivePower = voltageA * currentA * 0.435 / 1000;
        double powerFactor = 0.85 + r.nextDouble() * 0.13;
        double frequency = 49.95 + r.nextDouble() * 0.10;
        double temperature = 35 + r.nextDouble() * 30;

        return GridProtocol.StatusReportPayload.newBuilder()
                .setDeviceType(GridProtocol.DeviceType.TRANSFORMER)
                .setDeviceStatus(GridProtocol.DeviceStatus.ONLINE)
                .setVoltageA(voltageA)
                .setVoltageB(voltageB)
                .setVoltageC(voltageC)
                .setCurrentA(currentA)
                .setCurrentB(currentB)
                .setCurrentC(currentC)
                .setActivePower(activePower)
                .setReactivePower(reactivePower)
                .setPowerFactor(powerFactor)
                .setFrequency(frequency)
                .setTemperature(temperature)
                .setLoadRate(r.nextDouble() * 100)
                .build();
    }

    public double simulateNewEnergyOutput(String energyType) {
        if ("SOLAR".equalsIgnoreCase(energyType)) {
            int hour = java.time.LocalTime.now().getHour();
            double baseOutput;
            if (hour >= 6 && hour <= 18) {
                double peakFactor = Math.sin(Math.PI * (hour - 6) / 12.0);
                baseOutput = 500 * peakFactor;
            } else {
                baseOutput = 0;
            }
            return baseOutput * (0.7 + random.nextDouble() * 0.3);
        } else if ("WIND".equalsIgnoreCase(energyType)) {
            double gust = 1.0 + random.nextGaussian() * 0.3;
            double base = 50 + random.nextDouble() * 200;
            return Math.max(0, Math.min(300, base * gust));
        }
        return 0;
    }
}
