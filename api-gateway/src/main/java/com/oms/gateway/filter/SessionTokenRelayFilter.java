package com.oms.gateway.filter;

import com.oms.gateway.dto.TokenResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Instant;

@Component
@Slf4j
public class SessionTokenRelayFilter implements GlobalFilter, Ordered {

    private final WebClient webClient;
    private final String issuerUri;
    private static final String CLIENT_ID = "oms-client";

    public SessionTokenRelayFilter(WebClient.Builder webClientBuilder,
                                   @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}") String issuerUri) {
        this.webClient = webClientBuilder.build();
        this.issuerUri = issuerUri;
    }

    @Override
    public int getOrder() {
        return -100;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getPath().value();
        if (!path.startsWith("/api/")) {
            return chain.filter(exchange);
        }

        // If an Authorization header is already present (e.g. service-to-service), don't override it
        if (exchange.getRequest().getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
            return chain.filter(exchange);
        }

        return exchange.getSession().flatMap(session -> {
            String accessToken = (String) session.getAttributes().get("access_token");
            if (accessToken == null) {
                // No session — let the request through; downstream services protect their own endpoints
                return chain.filter(exchange);
            }

            Instant expiresAt = (Instant) session.getAttributes().get("expires_at");
            boolean needsRefresh = expiresAt == null || Instant.now().plusSeconds(30).isAfter(expiresAt);

            if (needsRefresh) {
                String refreshToken = (String) session.getAttributes().get("refresh_token");
                if (refreshToken == null) {
                    return reject(exchange);
                }
                return refreshToken(refreshToken)
                        .flatMap(tokens -> {
                            session.getAttributes().put("access_token", tokens.getAccessToken());
                            session.getAttributes().put("refresh_token", tokens.getRefreshToken());
                            session.getAttributes().put("expires_at",
                                    Instant.now().plusSeconds(Math.max(tokens.getExpiresIn() - 10, 0)));
                            return session.save()
                                    .then(relayWithToken(exchange, chain, tokens.getAccessToken()));
                        })
                        .onErrorResume(e -> {
                            log.warn("Token refresh failed, session expired: {}", e.getMessage());
                            return reject(exchange);
                        });
            }

            return relayWithToken(exchange, chain, accessToken);
        });
    }

    private Mono<TokenResponse> refreshToken(String refreshToken) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "refresh_token");
        form.add("client_id", CLIENT_ID);
        form.add("refresh_token", refreshToken);
        return webClient.post()
                .uri(issuerUri + "/protocol/openid-connect/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .bodyValue(form)
                .retrieve()
                .bodyToMono(TokenResponse.class);
    }

    private Mono<Void> relayWithToken(ServerWebExchange exchange, GatewayFilterChain chain, String token) {
        ServerWebExchange mutated = exchange.mutate()
                .request(r -> r.headers(h -> h.setBearerAuth(token)))
                .build();
        return chain.filter(mutated);
    }

    private Mono<Void> reject(ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        return exchange.getResponse().setComplete();
    }
}
