package com.smartgrid;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(exclude = {
        org.redisson.spring.starter.RedissonAutoConfiguration.class
})
@EnableScheduling
public class SmartGridApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartGridApplication.class, args);
    }
}
