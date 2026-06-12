package com.bonded.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.InetSocketAddress;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

public class RateLimitFilter implements GlobalFilter, Ordered {
    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);
    private static final long MAX_REQUESTS_PER_MINUTE = 600;
    private static final ConcurrentHashMap<String, TokenBucket> buckets = new ConcurrentHashMap<>();

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        InetSocketAddress remoteAddress = exchange.getRequest().getRemoteAddress();
        String clientIp = remoteAddress != null ? remoteAddress.getAddress().getHostAddress() : "unknown";

        TokenBucket bucket = buckets.computeIfAbsent(clientIp, k -> new TokenBucket());
        if (!bucket.tryConsume()) {
            log.warn("Rate limit exceeded for IP: {}", clientIp);
            exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
            DataBuffer buffer = exchange.getResponse().bufferFactory()
                .wrap("{\"code\":429,\"message\":\"请求过于频繁，请稍后再试\"}".getBytes());
            return exchange.getResponse().writeWith(Mono.just(buffer));
        }

        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return -90;
    }

    private static class TokenBucket {
        private final AtomicLong tokens = new AtomicLong(MAX_REQUESTS_PER_MINUTE);
        private volatile long lastRefillTime = System.currentTimeMillis();

        boolean tryConsume() {
            refill();
            long current;
            do {
                current = tokens.get();
                if (current <= 0) return false;
            } while (!tokens.compareAndSet(current, current - 1));
            return true;
        }

        private void refill() {
            long now = System.currentTimeMillis();
            long elapsed = now - lastRefillTime;
            if (elapsed >= 60000) {
                long newTokens = (elapsed / 60000) * MAX_REQUESTS_PER_MINUTE;
                long current;
                do {
                    current = tokens.get();
                    long updated = Math.min(current + newTokens, MAX_REQUESTS_PER_MINUTE);
                    if (tokens.compareAndSet(current, updated)) break;
                } while (true);
                lastRefillTime = now;
            }
        }
    }
}
