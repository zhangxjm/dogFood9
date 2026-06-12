package com.fraudguard;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableCaching
@EnableAsync
@EnableScheduling
public class FraudGuardApplication {

    public static void main(String[] args) {
        SpringApplication.run(FraudGuardApplication.class, args);
        System.out.println("\n" +
            "╔══════════════════════════════════════════════════════════════╗\n" +
            "║                                                              ║\n" +
            "║   ███████╗██████╗  █████╗ ██╗   ██╗██████╗  ██████╗ ██╗   ██╗║\n" +
            "║   ██╔════╝██╔══██╗██╔══██╗██║   ██║██╔══██╗██╔════╝ ██║   ██║║\n" +
            "║   █████╗  ██████╔╝███████║██║   ██║██║  ██║██║  ███╗██║   ██║║\n" +
            "║   ██╔══╝  ██╔══██╗██╔══██║██║   ██║██║  ██║██║   ██║██║   ██║║\n" +
            "║   ██║     ██║  ██║██║  ██║╚██████╔╝██████╔╝╚██████╔╝╚██████╔╝║\n" +
            "║   ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝  ╚═════╝  ╚═════╝ ║\n" +
            "║                                                              ║\n" +
            "║        金融机构实时反欺诈交易系统 v1.0.0                       ║\n" +
            "║        Real-time Anti-Fraud Transaction System               ║\n" +
            "║                                                              ║\n" +
            "║   系统访问地址: http://localhost:8080                        ║\n" +
            "║   健康检查:   http://localhost:8080/actuator/health          ║\n" +
            "║                                                              ║\n" +
            "╚══════════════════════════════════════════════════════════════╝\n");
    }
}
