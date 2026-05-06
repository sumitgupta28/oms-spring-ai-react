package com.oms.user.controller;

import com.oms.user.dto.request.ForgotPasswordRequest;
import com.oms.user.dto.request.RegisterRequest;
import com.oms.user.service.KeycloakUserService;
import com.oms.user.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class PublicUserController {

    private final KeycloakUserService keycloakUserService;
    private final UserProfileService userProfileService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> register(@Valid @RequestBody RegisterRequest req) {
        String keycloakId = keycloakUserService.createCustomer(req);
        userProfileService.createProfile(keycloakId);
        log.info("New customer registered: {}", req.getEmail());
        return Map.of("message", "Registration successful. You can now sign in.");
    }

    @PostMapping("/forgot-password")
    public Map<String, String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        keycloakUserService.triggerPasswordReset(req.getEmail());
        // Always return success to avoid email enumeration
        return Map.of("message", "If an account exists for this email, a reset link has been sent.");
    }
}
