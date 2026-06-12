package com.bonded.customs.service;

import com.bonded.customs.entity.ThreeDocument;
import com.bonded.customs.mapper.ThreeDocumentMapper;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
public class ThreeDocumentService {

    private final ThreeDocumentMapper documentMapper;

    public ThreeDocumentService(ThreeDocumentMapper documentMapper) {
        this.documentMapper = documentMapper;
    }

    public List<ThreeDocument> list() {
        return documentMapper.findAll();
    }

    public ThreeDocument getByOrderId(Long orderId) {
        return documentMapper.findByOrderId(orderId);
    }

    public ThreeDocument getByOrderNo(String orderNo) {
        return documentMapper.findByOrderNo(orderNo);
    }

    public ThreeDocument create(ThreeDocument document) {
        document.setMatchStatus("待比对");
        document.setCreateTime(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date()));
        documentMapper.insert(document);
        return documentMapper.findByOrderNo(document.getOrderNo());
    }

    public ThreeDocument compareDocuments(Long orderId) {
        ThreeDocument doc = documentMapper.findByOrderId(orderId);
        if (doc == null) {
            return null;
        }
        return doCompare(doc);
    }

    public ThreeDocument compareDocumentsByOrderNo(String orderNo) {
        ThreeDocument doc = documentMapper.findByOrderNo(orderNo);
        if (doc == null) {
            return null;
        }
        return doCompare(doc);
    }

    private ThreeDocument doCompare(ThreeDocument doc) {
        String orderDoc = doc.getOrderDocument();
        String paymentDoc = doc.getPaymentDocument();
        String logisticsDoc = doc.getLogisticsDocument();

        List<String> mismatches = new ArrayList<>();

        String orderBuyer = extractValue(orderDoc, "buyerName");
        String paymentPayer = extractValue(paymentDoc, "payerName");
        String logisticsReceiver = extractValue(logisticsDoc, "receiverName");

        if (orderBuyer != null && paymentPayer != null && !orderBuyer.equals(paymentPayer)) {
            mismatches.add("支付人姓名[" + paymentPayer + "]与订单购买人[" + orderBuyer + "]不匹配");
        }
        if (orderBuyer != null && logisticsReceiver != null && !orderBuyer.equals(logisticsReceiver)) {
            mismatches.add("物流收货人姓名[" + logisticsReceiver + "]与订单购买人[" + orderBuyer + "]不匹配");
        }

        String orderAmount = extractValue(orderDoc, "totalAmount");
        String paymentAmount = extractValue(paymentDoc, "paymentAmount");
        if (orderAmount != null && paymentAmount != null && !orderAmount.equals(paymentAmount)) {
            mismatches.add("订单金额[" + orderAmount + "]与支付金额[" + paymentAmount + "]不匹配");
        }

        String orderGoods = extractValue(orderDoc, "goods");
        String logisticsGoods = extractValue(logisticsDoc, "goods");
        if (orderGoods != null && logisticsGoods != null && !orderGoods.equals(logisticsGoods)) {
            mismatches.add("订单商品[" + orderGoods + "]与物流商品[" + logisticsGoods + "]不匹配");
        }

        String now = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());
        if (mismatches.isEmpty()) {
            documentMapper.updateMatchStatus(doc.getId(), "一致", "三单比对通过", now);
        } else {
            documentMapper.updateMatchStatus(doc.getId(), "不一致", String.join("；", mismatches), now);
        }

        return documentMapper.findByOrderId(doc.getOrderId());
    }

    private String extractValue(String json, String key) {
        if (json == null) return null;
        String pattern = "\"" + key + "\":\"";
        int start = json.indexOf(pattern);
        if (start < 0) {
            String numPattern = "\"" + key + "\":";
            int numStart = json.indexOf(numPattern);
            if (numStart < 0) return null;
            numStart += numPattern.length();
            int end = json.indexOf(",", numStart);
            if (end < 0) end = json.indexOf("}", numStart);
            if (end < 0) return null;
            return json.substring(numStart, end).trim();
        }
        start += pattern.length();
        int end = json.indexOf("\"", start);
        if (end < 0) return null;
        return json.substring(start, end);
    }
}
