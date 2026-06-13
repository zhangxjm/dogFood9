package com.smartgrid.config;

import com.smartgrid.controller.GridWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final GridWebSocketHandler gridWebSocketHandler;

    public WebSocketConfig(GridWebSocketHandler gridWebSocketHandler) {
        this.gridWebSocketHandler = gridWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(gridWebSocketHandler, "/ws/grid").setAllowedOrigins("*");
    }
}
