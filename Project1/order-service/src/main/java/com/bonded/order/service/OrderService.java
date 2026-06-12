package com.bonded.order.service;

import com.bonded.order.entity.Order;
import com.bonded.order.entity.OrderItem;
import com.bonded.order.mapper.OrderItemMapper;
import com.bonded.order.mapper.OrderMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.locks.ReentrantLock;

@Service
public class OrderService {

    private final OrderMapper orderMapper;
    private final OrderItemMapper orderItemMapper;
    private final ReentrantLock orderLock = new ReentrantLock();

    public OrderService(OrderMapper orderMapper, OrderItemMapper orderItemMapper) {
        this.orderMapper = orderMapper;
        this.orderItemMapper = orderItemMapper;
    }

    public List<Order> list() {
        return orderMapper.findAll();
    }

    public Order getById(Long id) {
        return orderMapper.findById(id);
    }

    public Order getByOrderNo(String orderNo) {
        return orderMapper.findByOrderNo(orderNo);
    }

    @Transactional
    public Order create(Order order, List<OrderItem> items) {
        orderLock.lock();
        try {
            String orderNo = "ORD" + System.currentTimeMillis();
            order.setOrderNo(orderNo);
            order.setVersion(1);
            order.setCreateTime(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date()));

            double totalAmount = 0;
            for (OrderItem item : items) {
                totalAmount += item.getPrice() * item.getQuantity();
            }
            order.setTotalAmount(totalAmount);

            orderMapper.insert(order);

            Long orderId = orderMapper.findByOrderNo(orderNo).getId();
            for (OrderItem item : items) {
                item.setOrderId(orderId);
                item.setAmount(item.getPrice() * item.getQuantity());
                synchronized (this) {
                    orderItemMapper.insert(item);
                }
            }

            return orderMapper.findByOrderNo(orderNo);
        } finally {
            orderLock.unlock();
        }
    }

    public boolean updateStatus(Long id, String status) {
        Order order = orderMapper.findById(id);
        if (order == null) {
            return false;
        }
        int rows = orderMapper.updateStatus(id, status);
        if (rows == 0) {
            throw new RuntimeException("订单版本冲突，请重试");
        }
        return true;
    }

    public boolean updatePaymentStatus(Long id, String paymentStatus) {
        Order order = orderMapper.findById(id);
        if (order == null) {
            return false;
        }
        int rows = orderMapper.updatePaymentStatus(id, paymentStatus);
        if (rows == 0) {
            throw new RuntimeException("订单版本冲突，请重试");
        }
        return true;
    }

    public boolean updateLogisticsStatus(Long id, String logisticsStatus) {
        Order order = orderMapper.findById(id);
        if (order == null) {
            return false;
        }
        int rows = orderMapper.updateLogisticsStatus(id, logisticsStatus);
        if (rows == 0) {
            throw new RuntimeException("订单版本冲突，请重试");
        }
        return true;
    }

    public boolean updateCustomsStatus(Long id, String customsStatus) {
        Order order = orderMapper.findById(id);
        if (order == null) {
            return false;
        }
        int rows = orderMapper.updateCustomsStatus(id, customsStatus);
        if (rows == 0) {
            throw new RuntimeException("订单版本冲突，请重试");
        }
        return true;
    }

    public List<Order> listByStatus(String status) {
        return orderMapper.findByStatus(status);
    }

    public Map<String, Integer> getOrderStatistics() {
        Map<String, Integer> stats = new HashMap<>();
        List<Order> all = orderMapper.findAll();
        stats.put("total", all.size());
        stats.put("pending", (int) all.stream().filter(o -> "待支付".equals(o.getStatus())).count());
        stats.put("paid", (int) all.stream().filter(o -> "已支付".equals(o.getStatus())).count());
        stats.put("shipped", (int) all.stream().filter(o -> "已发货".equals(o.getStatus())).count());
        stats.put("completed", (int) all.stream().filter(o -> "已完成".equals(o.getStatus())).count());
        return stats;
    }

    public List<Order> listPaged(int page, int size) {
        int offset = (page - 1) * size;
        return orderMapper.findPaged(size, offset);
    }
}
