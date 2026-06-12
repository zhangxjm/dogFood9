package com.bonded.order.service;

import com.bonded.order.entity.Order;
import com.bonded.order.entity.Payment;
import com.bonded.order.mapper.OrderMapper;
import com.bonded.order.mapper.PaymentMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class PaymentService {

    private final PaymentMapper paymentMapper;
    private final OrderMapper orderMapper;
    private final ExecutorService executor = Executors.newFixedThreadPool(4);

    public PaymentService(PaymentMapper paymentMapper, OrderMapper orderMapper) {
        this.paymentMapper = paymentMapper;
        this.orderMapper = orderMapper;
    }

    public List<Payment> list() {
        return paymentMapper.findAll();
    }

    public List<Payment> getByOrderId(Long orderId) {
        return paymentMapper.findByOrderId(orderId);
    }

    public List<Payment> getByOrderNo(String orderNo) {
        return paymentMapper.findByOrderNo(orderNo);
    }

    @Transactional
    public Payment create(Payment payment) {
        String paymentNo = "PAY" + System.currentTimeMillis();
        payment.setPaymentNo(paymentNo);
        payment.setPaymentTime(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date()));
        paymentMapper.insert(payment);
        return payment;
    }

    @Transactional
    public Payment processPayment(Long orderId) {
        Order order = orderMapper.findById(orderId);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }
        if ("已支付".equals(order.getPaymentStatus())) {
            throw new RuntimeException("订单已支付，无需重复支付");
        }

        Payment payment = new Payment();
        payment.setOrderId(orderId);
        payment.setOrderNo(order.getOrderNo());
        payment.setPaymentAmount(order.getTotalAmount());
        String paymentNo = "PAY" + System.currentTimeMillis();
        payment.setPaymentNo(paymentNo);
        payment.setPaymentChannel("支付宝");
        payment.setPaymentTime(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date()));
        payment.setStatus("已支付");

        executor.submit(() -> {
            try {
                Thread.sleep(500);
                paymentMapper.insert(payment);
                orderMapper.updatePaymentStatus(orderId, "已支付");
                orderMapper.updateStatus(orderId, "已支付");
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });

        return payment;
    }

    public boolean updateStatus(Long id, String status) {
        return paymentMapper.updateStatus(id, status) > 0;
    }
}
