package com.oms.gateway.controller;

import com.nimbusds.jwt.JWTParser;
import com.oms.gateway.dto.LoginRequest;
import com.oms.gateway.dto.TokenResponse;
import com.oms.gateway.dto.UserInfoResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.WebSession;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bff")
@Slf4j
public class BffAuthController {

    private final WebClient webClient;
    private final String issuerUri;
    private static final String CLIENT_ID = "oms-client";

    public BffAuthController(WebClient.Builder webClientBuilder,
                              @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}") String issuerUri) {
        this.webClient = webClientBuilder.build();
        this.issuerUri = issuerUri;
    }

    @PostMapping("/login")
    public Mono<ResponseEntity<UserInfoResponse>> login(@Valid @RequestBody LoginRequest req, WebSession session) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "password");
        form.add("client_id", CLIENT_ID);
        form.add("username", req.getUsername());
        form.add("password", req.getPassword());

        return webClient.post()
                .uri(issuerUri + "/protocol/openid-connect/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .bodyValue(form)
                .retrieve()
                .onStatus(status -> status.value() == 401,
                        r -> Mono.error(new UnauthorizedException("Invalid credentials")))
                .bodyToMono(TokenResponse.class)
                .flatMap(tokens -> {
                    UserInfoResponse userInfo = extractUserInfo(tokens.getAccessToken());
                    session.getAttributes().put("access_token", tokens.getAccessToken());
                    session.getAttributes().put("refresh_token", tokens.getRefreshToken());
                    session.getAttributes().put("expires_at",
                            Instant.now().plusSeconds(Math.max(tokens.getExpiresIn() - 10, 0)));
                    session.getAttributes().put("user_info", userInfo);
                    return session.save().thenReturn(ResponseEntity.ok(userInfo));
                })
                .onErrorResume(UnauthorizedException.class,
                        e -> Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()));
    }

    @GetMapping("/me")
    public Mono<ResponseEntity<UserInfoResponse>> me(WebSession session) {
        UserInfoResponse userInfo = (UserInfoResponse) session.getAttributes().get("user_info");
        if (userInfo == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }
        return Mono.just(ResponseEntity.ok(userInfo));
    }

    @PostMapping("/logout")
    public Mono<ResponseEntity<Void>> logout(WebSession session) {
        String refreshToken = (String) session.getAttributes().get("refresh_token");
        return session.invalidate()
                .then(revokeToken(refreshToken))
                .thenReturn(ResponseEntity.<Void>noContent().build());
    }

    private Mono<Void> revokeToken(String refreshToken) {
        if (refreshToken == null) return Mono.empty();
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", CLIENT_ID);
        form.add("refresh_token", refreshToken);
        return webClient.post()
                .uri(issuerUri + "/protocol/openid-connect/logout")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .bodyValue(form)
                .retrieve()
                .bodyToMono(Void.class)
                .onErrorResume(e -> {
                    log.warn("Token revocation failed (ignored): {}", e.getMessage());
                    return Mono.empty();
                });
    }

    @SuppressWarnings("unchecked")
    private UserInfoResponse extractUserInfo(String accessToken) {
        try {
            var claims = JWTParser.parse(accessToken).getJWTClaimsSet();
            String subject = claims.getSubject();
            String username = (String) claims.getClaim("preferred_username");
            String email = (String) claims.getClaim("email");
            Map<String, Object> realmAccess = (Map<String, Object>) claims.getClaim("realm_access");
            List<String> roles = realmAccess != null ? (List<String>) realmAccess.get("roles") : List.of();
            return UserInfoResponse.builder()
                    .id(subject)
                    .username(username != null ? username : subject)
                    .email(email != null ? email : "")
                    .roles(roles)
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse access token claims", e);
        }
    }

    static class UnauthorizedException extends RuntimeException {
        UnauthorizedException(String message) { super(message); }
    }
}
