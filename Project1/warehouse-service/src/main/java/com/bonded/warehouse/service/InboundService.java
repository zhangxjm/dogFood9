package com.bonded.warehouse.service;

import com.bonded.warehouse.entity.*;
import com.bonded.warehouse.mapper.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class InboundService {

    private final InboundOrderMapper inboundOrderMapper;
    private final InboundItemMapper inboundItemMapper;
    private final WarehouseLocationMapper locationMapper;
    private final SortTaskMapper sortTaskMapper;
    private final PackTaskMapper packTaskMapper;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public InboundService(InboundOrderMapper inboundOrderMapper, InboundItemMapper inboundItemMapper,
                          WarehouseLocationMapper locationMapper, SortTaskMapper sortTaskMapper,
                          PackTaskMapper packTaskMapper) {
        this.inboundOrderMapper = inboundOrderMapper;
        this.inboundItemMapper = inboundItemMapper;
        this.locationMapper = locationMapper;
        this.sortTaskMapper = sortTaskMapper;
        this.packTaskMapper = packTaskMapper;
    }

    public List<InboundOrder> list() {
        return inboundOrderMapper.findAll();
    }

    public InboundOrder getById(Long id) {
        return inboundOrderMapper.findById(id);
    }

    @Transactional
    public InboundOrder create(InboundOrder order, List<InboundItem> items) {
        String now = LocalDateTime.now().format(FMT);
        order.setCreateTime(now);
        order.setCompleteTime(null);
        if (order.getStatus() == null) {
            order.setStatus("待处理");
        }
        inboundOrderMapper.insert(order);
        InboundOrder saved = inboundOrderMapper.findByOrderNo(order.getOrderNo());
        if (saved != null && items != null) {
            for (InboundItem item : items) {
                item.setOrderId(saved.getId());
                inboundItemMapper.insert(item);
            }
        }
        return saved;
    }

    @Transactional
    public int complete(Long orderId) {
        InboundOrder order = inboundOrderMapper.findById(orderId);
        if (order == null) {
            return 0;
        }
        List<InboundItem> items = inboundItemMapper.findByOrderId(orderId);
        for (InboundItem item : items) {
            List<WarehouseLocation> available = locationMapper.findAvailable();
            WarehouseLocation assigned = null;
            for (WarehouseLocation loc : available) {
                if (loc.getGoodsId() != null && loc.getGoodsId().equals(item.getGoodsId())) {
                    if (loc.getUsedCapacity() + item.getQuantity() <= loc.getCapacity()) {
                        assigned = loc;
                        break;
                    }
                }
            }
            if (assigned == null && !available.isEmpty()) {
                for (WarehouseLocation loc : available) {
                    if (loc.getUsedCapacity() + item.getQuantity() <= loc.getCapacity()) {
                        assigned = loc;
                        break;
                    }
                }
            }
            if (assigned != null) {
                assigned.setGoodsId(item.getGoodsId());
                assigned.setGoodsName(item.getGoodsName());
                assigned.setUsedCapacity(assigned.getUsedCapacity() + item.getQuantity());
                assigned.setStatus("占用");
                assigned.setUpdateTime(LocalDateTime.now().format(FMT));
                locationMapper.update(assigned);
                item.setLocationId(assigned.getId());
                item.setLocationCode(assigned.getZone() + "-" + assigned.getRow() + "-" + assigned.getColumn() + "-" + assigned.getLayer());
            }

            SortTask sortTask = new SortTask();
            sortTask.setOrderId(orderId);
            sortTask.setGoodsId(item.getGoodsId());
            sortTask.setGoodsName(item.getGoodsName());
            sortTask.setFromLocation("收货区");
            sortTask.setToLocation(item.getLocationCode() != null ? item.getLocationCode() : "待分配");
            sortTask.setQuantity(item.getQuantity());
            sortTask.setStatus("待处理");
            sortTask.setCreateTime(LocalDateTime.now().format(FMT));
            sortTask.setCompleteTime(null);
            sortTaskMapper.insert(sortTask);

            PackTask packTask = new PackTask();
            packTask.setOrderId(orderId);
            packTask.setGoodsId(item.getGoodsId());
            packTask.setGoodsName(item.getGoodsName());
            packTask.setQuantity(item.getQuantity());
            packTask.setPackType("标准包装");
            packTask.setWeight(item.getQuantity() * 0.5);
            packTask.setStatus("待处理");
            packTask.setCreateTime(LocalDateTime.now().format(FMT));
            packTask.setCompleteTime(null);
            packTaskMapper.insert(packTask);
        }
        return inboundOrderMapper.updateStatus(orderId, "已完成");
    }
}
