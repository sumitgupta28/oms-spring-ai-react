package com.oms.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.server.session.CookieWebSessionIdResolver;
import org.springframework.web.server.session.WebSessionIdResolver;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Value("${server.ssl.enabled:false}")
    private boolean sslEnabled;

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        return http
                // CSRF disabled — SameSite=Strict on the session cookie provides equivalent protection
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(ex -> ex
                        .pathMatchers("/bff/login").permitAll()
                        .pathMatchers("/bff/**").permitAll()
                        .pathMatchers("/actuator/**", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        .pathMatchers(HttpMethod.GET, "/api/products/**", "/api/inventory/**").permitAll()
                        // SessionTokenRelayFilter enforces auth for all other /api/** routes
                        .anyExchange().permitAll()
                )
                .build();
    }

    @Bean
    public WebSessionIdResolver webSessionIdResolver() {
        CookieWebSessionIdResolver resolver = new CookieWebSessionIdResolver();
        resolver.setCookieName("OMS_SESSION");
        resolver.addCookieInitializer(builder -> {
            builder.httpOnly(true)
                    .sameSite("Strict")
                    .path("/");
            if (sslEnabled) {
                builder.secure(true);
            }
        });
        return resolver;
    }
}
