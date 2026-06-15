package com.exam.interceptor;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.exam.common.ResultCode;
import com.exam.common.UserContext;
import com.exam.config.JwtConfig;
import com.exam.entity.User;
import com.exam.exception.BusinessException;
import com.exam.mapper.UserMapper;
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

    private final JwtConfig jwtConfig;
    private final UserMapper userMapper;

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
        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getUsername, username));
        if (user == null) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }

        UserContext.setUserId(user.getId());
        UserContext.setUsername(user.getUsername());
        UserContext.setRole(user.getRole());

        log.debug("用户已认证: {}, role={}", username, user.getRole());
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        UserContext.clear();
    }
}
