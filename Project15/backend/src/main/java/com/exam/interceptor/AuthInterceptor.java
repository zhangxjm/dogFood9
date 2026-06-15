package com.exam.interceptor;

import com.exam.common.ResultCode;
import com.exam.config.JwtConfig;
import com.exam.exception.BusinessException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuthInterceptor implements HandlerInterceptor {

    public static final ThreadLocal<String> CURRENT_USER = new ThreadLocal<>();

    private final JwtConfig jwtConfig;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }

        String token = authHeader.substring(7);

        if (!jwtConfig.validateToken(token)) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }

        String username = jwtConfig.getUsernameFromToken(token);
        CURRENT_USER.set(username);
        log.debug("用户已认证: {}", username);
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        CURRENT_USER.remove();
    }
}
