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

public class SqlInjectionFilter implements GlobalFilter, Ordered {
    private static final Logger log = LoggerFactory.getLogger(SqlInjectionFilter.class);
    private static final Pattern[] SQL_PATTERNS = {
        Pattern.compile("(?i)(\\bunion\\b.*\\bselect\\b)"),
        Pattern.compile("(?i)(\\binsert\\b.*\\binto\\b)"),
        Pattern.compile("(?i)(\\bdelete\\b.*\\bfrom\\b)"),
        Pattern.compile("(?i)(\\bdrop\\b.*\\btable\\b)"),
        Pattern.compile("(?i)(\\bupdate\\b.*\\bset\\b)"),
        Pattern.compile("(?i)(\\bexec\\b.*\\()"),
        Pattern.compile("(?i)('.*or.*'.*=.*)"),
        Pattern.compile("(?i)(\\b1\\s*=\\s*1\\b)"),
        Pattern.compile("(?i)(\\bwaitfor\\b.*\\bdelay\\b)"),
        Pattern.compile("(?i)(\\bbenchmark\\b.*\\()"),
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
            for (Pattern pattern : SQL_PATTERNS) {
                if (pattern.matcher(decodedQuery).find()) {
                    log.warn("SQL Injection detected in query: {}", decodedQuery);
                    exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                    DataBuffer buffer = exchange.getResponse().bufferFactory()
                        .wrap("{\"code\":403,\"message\":\"检测到SQL注入攻击，请求已拦截\"}".getBytes());
                    return exchange.getResponse().writeWith(Mono.just(buffer));
                }
            }
        }
        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return -80;
    }
}
