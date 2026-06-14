package com.smartparking.hardware;

import org.springframework.stereotype.Component;

import java.util.Random;

@Component
public class HardwareSimulator {

    private final Random random = new Random();

    private static final String[] PLATE_PREFIXES = {"京", "沪", "粤", "浙", "苏", "鲁", "川", "渝"};
    private static final String PLATE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final String PLATE_DIGITS = "0123456789";

    public String recognizePlate() {
        return generateRandomPlate();
    }

    public String recognizePlate(String specificPlate) {
        return specificPlate;
    }

    private String generateRandomPlate() {
        StringBuilder sb = new StringBuilder();
        sb.append(PLATE_PREFIXES[random.nextInt(PLATE_PREFIXES.length)]);
        sb.append(PLATE_CHARS.charAt(random.nextInt(PLATE_CHARS.length())));
        for (int i = 0; i < 5; i++) {
            sb.append(PLATE_DIGITS.charAt(random.nextInt(PLATE_DIGITS.length())));
        }
        return sb.toString();
    }

    public void controlGate(Long gateId, String command) {
        try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    public boolean detectSpot(Long spotId) {
        return random.nextDouble() > 0.05;
    }
}
