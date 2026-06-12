package com.bonded.customs;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class CustomsApplication {
    public static void main(String[] args) {
        SpringApplication.run(CustomsApplication.class, args);
    }
}
