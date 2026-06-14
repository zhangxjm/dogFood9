package com.smartparking.service;

import com.smartparking.entity.BillingRecord;
import com.smartparking.entity.BillingRule;
import com.smartparking.entity.EntryExitRecord;
import com.smartparking.entity.MonthlyRental;
import com.smartparking.repository.BillingRecordRepository;
import com.smartparking.repository.BillingRuleRepository;
import com.smartparking.repository.EntryExitRecordRepository;
import com.smartparking.repository.MonthlyRentalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class BillingService {

    @Autowired
    private BillingRecordRepository billingRecordRepository;

    @Autowired
    private BillingRuleRepository billingRuleRepository;

    @Autowired
    private EntryExitRecordRepository entryExitRecordRepository;

    @Autowired
    private MonthlyRentalRepository monthlyRentalRepository;

    public Map<String, Object> calculateFee(String plateNumber) {
        var recordOpt = entryExitRecordRepository.findByPlateNumberAndStatus(plateNumber, EntryExitRecord.RecordStatus.PARKING);
        if (recordOpt.isEmpty()) {
            return null;
        }

        EntryExitRecord record = recordOpt.get();
        LocalDateTime now = LocalDateTime.now();
        long durationMinutes = Duration.between(record.getEntryTime(), now).toMinutes();

        boolean isMonthly = monthlyRentalRepository.findByPlateNumberAndStatus(plateNumber, MonthlyRental.RentalStatus.ACTIVE).isPresent();
        double fee = 0;
        if (!isMonthly) {
            BillingRule rule = billingRuleRepository.findByType("standard").orElse(null);
            if (rule != null) {
                double hours = Math.ceil(durationMinutes / 60.0);
                if (hours <= 1) {
                    fee = rule.getFirstHourFee();
                } else {
                    fee = rule.getFirstHourFee() + (hours - 1) * rule.getAdditionalHourFee();
                }
                if (fee > rule.getDailyMaxFee()) {
                    fee = rule.getDailyMaxFee();
                }
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("plateNumber", plateNumber);
        result.put("durationMinutes", durationMinutes);
        result.put("fee", fee);
        result.put("isMonthly", isMonthly);
        result.put("entryTime", record.getEntryTime().toString());
        return result;
    }

    @Transactional
    public BillingRecord createBillingRecord(Long recordId, String plateNumber, Double amount) {
        BillingRecord billingRecord = new BillingRecord();
        billingRecord.setRecordId(recordId);
        billingRecord.setPlateNumber(plateNumber);
        billingRecord.setAmount(amount);
        billingRecord.setStatus(BillingRecord.BillingStatus.UNPAID);
        billingRecord.setCreatedAt(LocalDateTime.now());
        return billingRecordRepository.save(billingRecord);
    }

    @Transactional
    public BillingRecord processPayment(Long billingId, BillingRecord.PayMethod payMethod) {
        BillingRecord record = billingRecordRepository.findById(billingId).orElse(null);
        if (record == null) {
            return null;
        }
        if (record.getStatus() == BillingRecord.BillingStatus.PAID) {
            return null;
        }
        record.setStatus(BillingRecord.BillingStatus.PAID);
        record.setPayMethod(payMethod);
        record.setPayTime(LocalDateTime.now());
        return billingRecordRepository.save(record);
    }

    public List<BillingRecord> listBillingRecords() {
        return billingRecordRepository.findAll();
    }

    public List<BillingRecord> listByPlateNumber(String plateNumber) {
        return billingRecordRepository.findByPlateNumberOrderByCreatedAtDesc(plateNumber);
    }

    public BillingRule getRule() {
        return billingRuleRepository.findByType("standard").orElse(null);
    }

    @Transactional
    public BillingRule updateRule(Double firstHourFee, Double additionalHourFee, Double dailyMaxFee, Double monthlyFee) {
        BillingRule rule = billingRuleRepository.findByType("standard").orElse(new BillingRule());
        rule.setType("standard");
        if (firstHourFee != null) rule.setFirstHourFee(firstHourFee);
        if (additionalHourFee != null) rule.setAdditionalHourFee(additionalHourFee);
        if (dailyMaxFee != null) rule.setDailyMaxFee(dailyMaxFee);
        if (monthlyFee != null) rule.setMonthlyFee(monthlyFee);
        return billingRuleRepository.save(rule);
    }

    public double calculateTodayRevenue() {
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        List<BillingRecord> paidRecords = billingRecordRepository.findByStatus(BillingRecord.BillingStatus.PAID);
        double total = 0;
        for (BillingRecord r : paidRecords) {
            if (r.getPayTime() != null && !r.getPayTime().isBefore(startOfDay)) {
                total += r.getAmount();
            }
        }
        return total;
    }
}
