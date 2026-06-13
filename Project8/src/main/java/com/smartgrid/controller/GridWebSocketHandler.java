package com.smartgrid.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartgrid.repository.GridDeviceRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@Slf4j
public class GridWebSocketHandler extends TextWebSocketHandler {

    private final GridDeviceRepository gridDeviceRepository;
    private final ObjectMapper objectMapper;
    private final List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();

    public GridWebSocketHandler(GridDeviceRepository gridDeviceRepository, ObjectMapper objectMapper) {
        this.gridDeviceRepository = gridDeviceRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        JsonNode node = objectMapper.readTree(message.getPayload());
        if ("subscribe".equals(node.path("type").asText())) {
            String data = objectMapper.writeValueAsString(gridDeviceRepository.findAll());
            session.sendMessage(new TextMessage(data));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
    }

    @Scheduled(fixedRate = 5000)
    public void broadcastUpdates() {
        if (sessions.isEmpty()) {
            return;
        }
        try {
            String data = objectMapper.writeValueAsString(gridDeviceRepository.findAll());
            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(data));
                }
            }
        } catch (IOException e) {
            log.error("Broadcast failed", e);
        }
    }
}
