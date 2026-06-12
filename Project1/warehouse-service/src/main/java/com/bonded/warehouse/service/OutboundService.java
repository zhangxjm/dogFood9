package com.bonded.warehouse.service;

import com.bonded.warehouse.entity.*;
import com.bonded.warehouse.mapper.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class OutboundService {

    private final OutboundOrderMapper outboundOrderMapper;
    private final OutboundItemMapper outboundItemMapper;
    private final WarehouseLocationMapper locationMapper;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public OutboundService(OutboundOrderMapper outboundOrderMapper, OutboundItemMapper outboundItemMapper,
                           WarehouseLocationMapper locationMapper) {
        this.outboundOrderMapper = outboundOrderMapper;
        this.outboundItemMapper = outboundItemMapper;
        this.locationMapper = locationMapper;
    }

    public List<OutboundOrder> list() {
        return outboundOrderMapper.findAll();
    }

    public OutboundOrder getById(Long id) {
        return outboundOrderMapper.findById(id);
    }

    @Transactional
    public OutboundOrder create(OutboundOrder order, List<OutboundItem> items) {
        String now = LocalDateTime.now().format(FMT);
        order.setCreateTime(now);
        order.setCompleteTime(null);
        if (order.getStatus() == null) {
            order.setStatus("待处理");
        }
        outboundOrderMapper.insert(order);
        OutboundOrder saved = outboundOrderMapper.findByOrderNo(order.getOrderNo());
        if (saved != null && items != null) {
            for (OutboundItem item : items) {
                item.setOrderId(saved.getId());
                outboundItemMapper.insert(item);
            }
        }
        return saved;
    }

    @Transactional
    public int complete(Long orderId) {
        OutboundOrder order = outboundOrderMapper.findById(orderId);
        if (order == null) {
            return 0;
        }
        List<OutboundItem> items = outboundItemMapper.findByOrderId(orderId);
        for (OutboundItem item : items) {
            if (item.getLocationId() != null) {
                WarehouseLocation loc = locationMapper.findById(item.getLocationId());
                if (loc != null) {
                    loc.setUsedCapacity(Math.max(0, loc.getUsedCapacity() - item.getQuantity()));
                    if (loc.getUsedCapacity() == 0) {
                        loc.setGoodsId(null);
                        loc.setGoodsName(null);
                        loc.setStatus("空闲");
                    }
                    loc.setUpdateTime(LocalDateTime.now().format(FMT));
                    locationMapper.update(loc);
                }
            } else if (item.getGoodsId() != null) {
                List<WarehouseLocation> locs = locationMapper.findByGoodsId(item.getGoodsId());
                if (!locs.isEmpty()) {
                    WarehouseLocation loc = locs.get(0);
                    loc.setUsedCapacity(Math.max(0, loc.getUsedCapacity() - item.getQuantity()));
                    if (loc.getUsedCapacity() == 0) {
                        loc.setGoodsId(null);
                        loc.setGoodsName(null);
                        loc.setStatus("空闲");
                    }
                    loc.setUpdateTime(LocalDateTime.now().format(FMT));
                    locationMapper.update(loc);
                }
            }
        }
        return outboundOrderMapper.updateStatus(orderId, "已完成");
    }
}
