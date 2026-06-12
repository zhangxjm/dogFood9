package com.bonded.order.service;

import com.bonded.order.entity.Logistics;
import com.bonded.order.entity.Order;
import com.bonded.order.mapper.LogisticsMapper;
import com.bonded.order.mapper.OrderMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

@Service
public class LogisticsService {

    private final LogisticsMapper logisticsMapper;
    private final OrderMapper orderMapper;

    public LogisticsService(LogisticsMapper logisticsMapper, OrderMapper orderMapper) {
        this.logisticsMapper = logisticsMapper;
        this.orderMapper = orderMapper;
    }

    public List<Logistics> list() {
        return logisticsMapper.findAll();
    }

    public List<Logistics> getByOrderId(Long orderId) {
        return logisticsMapper.findByOrderId(orderId);
    }

    public List<Logistics> getByOrderNo(String orderNo) {
        return logisticsMapper.findByOrderNo(orderNo);
    }

    @Transactional
    public Logistics create(Logistics logistics) {
        String trackingNo = "SF" + String.format("%012d", System.currentTimeMillis());
        logistics.setTrackingNo(trackingNo);
        String now = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());
        logistics.setCreateTime(now);
        logistics.setUpdateTime(now);
        logisticsMapper.insert(logistics);
        return logistics;
    }

    @Transactional
    public Logistics shipOrder(Long orderId) {
        Order order = orderMapper.findById(orderId);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }
        if (!"已支付".equals(order.getPaymentStatus())) {
            throw new RuntimeException("订单未支付，无法发货");
        }
        if ("已发货".equals(order.getLogisticsStatus()) || "已签收".equals(order.getLogisticsStatus())) {
            throw new RuntimeException("订单已发货，无需重复发货");
        }

        Logistics logistics = new Logistics();
        logistics.setOrderId(orderId);
        logistics.setOrderNo(order.getOrderNo());
        String trackingNo = "SF" + String.format("%012d", System.currentTimeMillis());
        logistics.setTrackingNo(trackingNo);
        logistics.setLogisticsCompany("顺丰速运");
        logistics.setStatus("运输中");
        logistics.setReceiverName(order.getBuyerName());
        logistics.setReceiverPhone(order.getBuyerPhone());
        logistics.setReceiverAddress("上海市浦东新区陆家嘴路100号");
        String now = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());
        logistics.setCreateTime(now);
        logistics.setUpdateTime(now);

        logisticsMapper.insert(logistics);
        orderMapper.updateLogisticsStatus(orderId, "已发货");
        orderMapper.updateStatus(orderId, "已发货");

        return logistics;
    }

    public boolean updateStatus(Long id, String status) {
        return logisticsMapper.updateStatus(id, status) > 0;
    }
}
