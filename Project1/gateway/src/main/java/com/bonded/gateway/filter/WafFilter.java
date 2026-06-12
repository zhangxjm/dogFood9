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

import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

public class WafFilter implements GlobalFilter, Ordered {
    private static final Logger log = LoggerFactory.getLogger(WafFilter.class);
    private static final Set<String> BLOCKED_IPS = ConcurrentHashMap.newKeySet();
    private static final Set<String> ATTACK_PATTERNS = Set.of(
        "\\.\\./", "\\.\\\\", "%2e%2e%2f", "%2e%2e/",
        "/etc/passwd", "/proc/self", "c:\\\\windows",
        "cmd\\.exe", "powershell", "bash\\s*-c", "sh\\s*-c",
        "[;&|]{1,2}\\s*(ls|cat|rm|cp|mv|wget|curl|nc|chmod|chown)",
        "[;&|]\\s*(echo|whoami|id|uname|pwd|ps|kill)",
        "<script", "javascript:", "onerror\\s*=", "onload\\s*=",
        "union\\s+select", "drop\\s+table", "delete\\s+from",
        "or\\s+1\\s*=\\s*1", "and\\s+1\\s*=\\s*1",
        "exec\\s*\\(", "eval\\s*\\(", "system\\s*\\("
    );

    static {
        BLOCKED_IPS.add("0.0.0.0");
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        InetSocketAddress remoteAddress = request.getRemoteAddress();
        String clientIp = remoteAddress != null ? remoteAddress.getAddress().getHostAddress() : "unknown";

        if (BLOCKED_IPS.contains(clientIp)) {
            log.warn("WAF: Blocked IP {}", clientIp);
            exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
            DataBuffer buffer = exchange.getResponse().bufferFactory()
                .wrap("{\"code\":403,\"message\":\"访问被WAF拦截\"}".getBytes());
            return exchange.getResponse().writeWith(Mono.just(buffer));
        }

        String path = request.getURI().getPath();
        String rawQuery = request.getURI().getRawQuery();
        String decodedUri = path;
        if (rawQuery != null) {
            try {
                decodedUri = path + "?" + URLDecoder.decode(rawQuery, StandardCharsets.UTF_8);
            } catch (Exception e) {
                decodedUri = path + "?" + rawQuery;
            }
        }
        String fullUri = decodedUri.toLowerCase();

        for (String pattern : ATTACK_PATTERNS) {
            if (fullUri.matches(".*" + pattern + ".*")) {
                log.warn("WAF: Attack pattern detected from IP {}: {}", clientIp, decodedUri);
                exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                DataBuffer buffer = exchange.getResponse().bufferFactory()
                    .wrap("{\"code\":403,\"message\":\"请求被WAF安全策略拦截\"}".getBytes());
                return exchange.getResponse().writeWith(Mono.just(buffer));
            }
        }

        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return -100;
    }
}
