package com.bonded.warehouse.scheduler;

import com.bonded.warehouse.service.InventoryAlertService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class InventoryScheduler {

    private static final Logger log = LoggerFactory.getLogger(InventoryScheduler.class);
    private final InventoryAlertService alertService;

    public InventoryScheduler(InventoryAlertService alertService) {
        this.alertService = alertService;
    }

    @Scheduled(fixedRate = 60000)
    public void checkInventory() {
        int count = alertService.checkAndAlert();
        if (count > 0) {
            log.info("库存预警检查完成，新增预警{}条", count);
        }
    }
}
