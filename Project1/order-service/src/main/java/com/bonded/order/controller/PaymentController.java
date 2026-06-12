package com.bonded.order.controller;

import com.bonded.common.result.Result;
import com.bonded.order.entity.Payment;
import com.bonded.order.service.PaymentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/payment")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping("/list")
    public Result<List<Payment>> list() {
        return Result.success(paymentService.list());
    }

    @GetMapping("/order/{orderId}")
    public Result<List<Payment>> getByOrderId(@PathVariable Long orderId) {
        return Result.success(paymentService.getByOrderId(orderId));
    }

    @GetMapping("/no/{orderNo}")
    public Result<List<Payment>> getByOrderNo(@PathVariable String orderNo) {
        return Result.success(paymentService.getByOrderNo(orderNo));
    }

    @PostMapping
    public Result<Payment> create(@RequestBody Payment payment) {
        return Result.success(paymentService.create(payment));
    }

    @PostMapping("/process/{orderId}")
    public Result<Payment> processPayment(@PathVariable Long orderId) {
        try {
            return Result.success(paymentService.processPayment(orderId));
        } catch (RuntimeException e) {
            return Result.fail(e.getMessage());
        }
    }
}
