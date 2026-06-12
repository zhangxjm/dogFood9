package com.bonded.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;

public class XssFilter implements GlobalFilter, Ordered {
    private static final Logger log = LoggerFactory.getLogger(XssFilter.class);
    private static final Pattern[] XSS_PATTERNS = {
        Pattern.compile("(?i)<script[^>]*>.*?</script>"),
        Pattern.compile("(?i)javascript\\s*:"),
        Pattern.compile("(?i)on(error|load|click|mouseover|focus|blur)\\s*="),
        Pattern.compile("(?i)<iframe[^>]*>"),
        Pattern.compile("(?i)<object[^>]*>"),
        Pattern.compile("(?i)<embed[^>]*>"),
        Pattern.compile("(?i)expression\\s*\\("),
        Pattern.compile("(?i)vbscript\\s*:"),
    };

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String rawQuery = request.getURI().getRawQuery();
        if (rawQuery != null) {
            String decodedQuery;
            try {
                decodedQuery = URLDecoder.decode(rawQuery, StandardCharsets.UTF_8);
            } catch (Exception e) {
                decodedQuery = rawQuery;
            }
            for (Pattern pattern : XSS_PATTERNS) {
                if (pattern.matcher(decodedQuery).find()) {
                    log.warn("XSS attack detected in query: {}", decodedQuery);
                    exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                    DataBuffer buffer = exchange.getResponse().bufferFactory()
                        .wrap("{\"code\":403,\"message\":\"检测到XSS攻击，请求已拦截\"}".getBytes());
                    return exchange.getResponse().writeWith(Mono.just(buffer));
                }
            }
        }
        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return -70;
    }
}
