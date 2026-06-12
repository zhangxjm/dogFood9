package com.bonded.warehouse.service;

import com.bonded.warehouse.entity.WarehouseLocation;
import com.bonded.warehouse.mapper.WarehouseLocationMapper;
import com.bonded.warehouse.mapper.GoodsMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class WarehouseLocationService {

    private final WarehouseLocationMapper locationMapper;
    private final GoodsMapper goodsMapper;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public WarehouseLocationService(WarehouseLocationMapper locationMapper, GoodsMapper goodsMapper) {
        this.locationMapper = locationMapper;
        this.goodsMapper = goodsMapper;
    }

    public List<WarehouseLocation> list() {
        return locationMapper.findAll();
    }

    public WarehouseLocation getById(Long id) {
        return locationMapper.findById(id);
    }

    public int create(WarehouseLocation location) {
        location.setUpdateTime(LocalDateTime.now().format(FMT));
        if (location.getStatus() == null) {
            location.setStatus("空闲");
        }
        if (location.getUsedCapacity() == null) {
            location.setUsedCapacity(0);
        }
        return locationMapper.insert(location);
    }

    public int update(WarehouseLocation location) {
        location.setUpdateTime(LocalDateTime.now().format(FMT));
        return locationMapper.update(location);
    }

    public List<WarehouseLocation> listAvailable() {
        return locationMapper.findAvailable();
    }

    public int assignGoods(Long goodsId, Long locationId) {
        WarehouseLocation loc = locationMapper.findById(locationId);
        if (loc == null) {
            return 0;
        }
        var goods = goodsMapper.findById(goodsId);
        loc.setGoodsId(goodsId);
        loc.setGoodsName(goods != null ? goods.getName() : null);
        loc.setUsedCapacity(loc.getUsedCapacity() + 1);
        loc.setStatus("占用");
        loc.setUpdateTime(LocalDateTime.now().format(FMT));
        return locationMapper.update(loc);
    }

    public List<WarehouseLocation> optimizeLocations() {
        List<WarehouseLocation> allLocations = locationMapper.findAll();
        Map<String, List<WarehouseLocation>> zoneMap = allLocations.stream()
                .filter(l -> l.getGoodsId() != null)
                .collect(Collectors.groupingBy(WarehouseLocation::getZone));

        List<WarehouseLocation> optimized = new ArrayList<>();
        for (Map.Entry<String, List<WarehouseLocation>> entry : zoneMap.entrySet()) {
            List<WarehouseLocation> zoneLocations = entry.getValue();
            Map<Long, List<WarehouseLocation>> goodsGroup = zoneLocations.stream()
                    .collect(Collectors.groupingBy(WarehouseLocation::getGoodsId));

            for (Map.Entry<Long, List<WarehouseLocation>> goodsEntry : goodsGroup.entrySet()) {
                if (goodsEntry.getValue().size() > 1) {
                    List<WarehouseLocation> sameGoodsLocs = goodsEntry.getValue();
                    sameGoodsLocs.sort(Comparator.comparing(WarehouseLocation::getCapacity));
                    WarehouseLocation target = sameGoodsLocs.get(sameGoodsLocs.size() - 1);
                    int totalUsed = sameGoodsLocs.stream()
                            .mapToInt(WarehouseLocation::getUsedCapacity)
                            .sum();
                    if (totalUsed <= target.getCapacity()) {
                        target.setUsedCapacity(totalUsed);
                        target.setUpdateTime(LocalDateTime.now().format(FMT));
                        locationMapper.update(target);
                        optimized.add(target);
                        for (int i = 0; i < sameGoodsLocs.size() - 1; i++) {
                            WarehouseLocation freed = sameGoodsLocs.get(i);
                            freed.setGoodsId(null);
                            freed.setGoodsName(null);
                            freed.setUsedCapacity(0);
                            freed.setStatus("空闲");
                            freed.setUpdateTime(LocalDateTime.now().format(FMT));
                            locationMapper.update(freed);
                            optimized.add(freed);
                        }
                    }
                }
            }
        }

        List<WarehouseLocation> available = locationMapper.findAvailable();
        for (WarehouseLocation loc : allLocations) {
            if (loc.getGoodsId() != null && loc.getStatus().equals("占用")) {
                if (loc.getUsedCapacity() < loc.getCapacity()) {
                    continue;
                }
            }
        }
        if (optimized.isEmpty()) {
            return locationMapper.findAll();
        }
        return optimized;
    }
}
