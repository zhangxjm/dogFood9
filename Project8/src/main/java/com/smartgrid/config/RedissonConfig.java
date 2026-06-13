package com.smartgrid.config;

import org.redisson.Redisson;
import org.redisson.api.RedissonClient;
import org.redisson.config.Config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class RedissonConfig {

    @Value("${spring.redis.host:localhost}")
    private String host;

    @Value("${spring.redis.port:6379}")
    private String port;

    @Bean(destroyMethod = "shutdown")
    @Primary
    public RedissonClient redissonClient() {
        Config config = new Config();
        config.useSingleServer()
                .setAddress("redis://" + host + ":" + port)
                .setConnectionPoolSize(10)
                .setConnectionMinimumIdleSize(2)
                .setConnectTimeout(5000)
                .setTimeout(5000)
                .setRetryAttempts(3)
                .setRetryInterval(1000);
        return Redisson.create(config);
    }
}
