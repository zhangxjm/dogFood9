package com.bonded.gateway.config;

import com.bonded.gateway.filter.RateLimitFilter;
import com.bonded.gateway.filter.SqlInjectionFilter;
import com.bonded.gateway.filter.WafFilter;
import com.bonded.gateway.filter.XssFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

@Configuration
public class GatewayConfig {

    @Bean
    public WafFilter wafFilter() {
        return new WafFilter();
    }

    @Bean
    public RateLimitFilter rateLimitFilter() {
        return new RateLimitFilter();
    }

    @Bean
    public SqlInjectionFilter sqlInjectionFilter() {
        return new SqlInjectionFilter();
    }

    @Bean
    public XssFilter xssFilter() {
        return new XssFilter();
    }

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.addAllowedOriginPattern("*");
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsWebFilter(source);
    }
}
