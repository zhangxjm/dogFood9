package com.bonded.warehouse.service;

import com.bonded.warehouse.entity.InventoryAlert;
import com.bonded.warehouse.entity.WarehouseLocation;
import com.bonded.warehouse.mapper.InventoryAlertMapper;
import com.bonded.warehouse.mapper.WarehouseLocationMapper;
import com.bonded.warehouse.mapper.GoodsMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class InventoryAlertService {

    private final InventoryAlertMapper alertMapper;
    private final WarehouseLocationMapper locationMapper;
    private final GoodsMapper goodsMapper;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public InventoryAlertService(InventoryAlertMapper alertMapper, WarehouseLocationMapper locationMapper,
                                 GoodsMapper goodsMapper) {
        this.alertMapper = alertMapper;
        this.locationMapper = locationMapper;
        this.goodsMapper = goodsMapper;
    }

    public List<InventoryAlert> list() {
        return alertMapper.findAll();
    }

    public List<InventoryAlert> listPending() {
        return alertMapper.findByStatus("未处理");
    }

    public int checkAndAlert() {
        List<WarehouseLocation> allLocations = locationMapper.findAll();
        Map<Long, Integer> goodsQuantityMap = new HashMap<>();
        for (WarehouseLocation loc : allLocations) {
            if (loc.getGoodsId() != null) {
                goodsQuantityMap.merge(loc.getGoodsId(), loc.getUsedCapacity(), Integer::sum);
            }
        }

        int alertCount = 0;
        for (Map.Entry<Long, Integer> entry : goodsQuantityMap.entrySet()) {
            Long goodsId = entry.getKey();
            int quantity = entry.getValue();
            int threshold = 10;

            List<InventoryAlert> existingAlerts = alertMapper.findByGoodsId(goodsId);
            boolean hasActiveAlert = existingAlerts.stream()
                    .anyMatch(a -> a.getStatus().equals("未处理"));

            if (quantity < threshold && !hasActiveAlert) {
                var goods = goodsMapper.findById(goodsId);
                InventoryAlert alert = new InventoryAlert();
                alert.setGoodsId(goodsId);
                alert.setGoodsName(goods != null ? goods.getName() : "未知商品");
                alert.setAlertType(quantity == 0 ? "缺货" : "库存不足");
                alert.setThreshold(threshold);
                alert.setCurrentQuantity(quantity);
                alert.setStatus("未处理");
                alert.setCreateTime(LocalDateTime.now().format(FMT));
                alertMapper.insert(alert);
                alertCount++;
            }
        }
        return alertCount;
    }

    public int createAlert(Long goodsId, String alertType, Integer threshold) {
        var goods = goodsMapper.findById(goodsId);
        List<WarehouseLocation> locs = locationMapper.findByGoodsId(goodsId);
        int currentQty = locs.stream().mapToInt(WarehouseLocation::getUsedCapacity).sum();

        InventoryAlert alert = new InventoryAlert();
        alert.setGoodsId(goodsId);
        alert.setGoodsName(goods != null ? goods.getName() : "未知商品");
        alert.setAlertType(alertType);
        alert.setThreshold(threshold);
        alert.setCurrentQuantity(currentQty);
        alert.setStatus("未处理");
        alert.setCreateTime(LocalDateTime.now().format(FMT));
        return alertMapper.insert(alert);
    }

    public int resolveAlert(Long alertId) {
        return alertMapper.updateStatus(alertId, "已处理");
    }
}
