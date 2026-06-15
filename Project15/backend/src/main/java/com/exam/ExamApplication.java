package com.exam;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

import java.io.File;

@SpringBootApplication
@EnableAsync
@MapperScan("com.exam.mapper")
public class ExamApplication {
    public static void main(String[] args) {
        try {
            File dataDir = new File("./data");
            if (!dataDir.exists()) {
                dataDir.mkdirs();
                System.out.println("[Init] Created data directory: " + dataDir.getAbsolutePath());
            }
        } catch (Exception e) {
            System.err.println("[Init] Could not create data directory: " + e.getMessage());
        }
        SpringApplication.run(ExamApplication.class, args);
    }
}
