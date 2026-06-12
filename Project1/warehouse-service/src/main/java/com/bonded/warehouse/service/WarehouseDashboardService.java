package com.bonded.warehouse.service;

import com.bonded.warehouse.mapper.*;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class WarehouseDashboardService {

    private final GoodsMapper goodsMapper;
    private final WarehouseLocationMapper locationMapper;
    private final InboundOrderMapper inboundOrderMapper;
    private final OutboundOrderMapper outboundOrderMapper;
    private final InventoryAlertMapper alertMapper;

    public WarehouseDashboardService(GoodsMapper goodsMapper, WarehouseLocationMapper locationMapper,
                                     InboundOrderMapper inboundOrderMapper, OutboundOrderMapper outboundOrderMapper,
                                     InventoryAlertMapper alertMapper) {
        this.goodsMapper = goodsMapper;
        this.locationMapper = locationMapper;
        this.inboundOrderMapper = inboundOrderMapper;
        this.outboundOrderMapper = outboundOrderMapper;
        this.alertMapper = alertMapper;
    }

    public Map<String, Object> getDashboard() {
        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("totalGoods", goodsMapper.findAll().size());
        List<com.bonded.warehouse.entity.WarehouseLocation> locations = locationMapper.findAll();
        dashboard.put("totalLocations", locations.size());
        dashboard.put("pendingInbound", inboundOrderMapper.findPending().size());
        dashboard.put("pendingOutbound", outboundOrderMapper.findPending().size());
        dashboard.put("alertCount", alertMapper.findByStatus("未处理").size());
        long usedLocations = locations.stream().filter(l -> "占用".equals(l.getStatus())).count();
        double utilizationRate = locations.isEmpty() ? 0 : (double) usedLocations / locations.size() * 100;
        dashboard.put("utilizationRate", Math.round(utilizationRate * 100.0) / 100.0);
        return dashboard;
    }
}
