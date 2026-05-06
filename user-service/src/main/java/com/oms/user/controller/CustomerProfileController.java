package com.oms.user.controller;

import com.oms.user.dto.request.SaveAddressRequest;
import com.oms.user.dto.request.SavePaymentMethodRequest;
import com.oms.user.dto.response.AddressResponse;
import com.oms.user.dto.response.PaymentMethodResponse;
import com.oms.user.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class CustomerProfileController {

    private final UserProfileService userProfileService;

    // ── Addresses ────────────────────────────────────────────────────────────────

    @GetMapping("/addresses")
    public List<AddressResponse> getAddresses(@AuthenticationPrincipal Jwt jwt) {
        return userProfileService.getAddresses(jwt.getSubject());
    }

    @PostMapping("/addresses")
    @ResponseStatus(HttpStatus.CREATED)
    public AddressResponse addAddress(@AuthenticationPrincipal Jwt jwt,
                                       @Valid @RequestBody SaveAddressRequest req) {
        return userProfileService.addAddress(jwt.getSubject(), req);
    }

    @PutMapping("/addresses/{id}")
    public AddressResponse updateAddress(@AuthenticationPrincipal Jwt jwt,
                                          @PathVariable UUID id,
                                          @Valid @RequestBody SaveAddressRequest req) {
        return userProfileService.updateAddress(jwt.getSubject(), id, req);
    }

    @DeleteMapping("/addresses/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAddress(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        userProfileService.deleteAddress(jwt.getSubject(), id);
    }

    @PutMapping("/addresses/{id}/default")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void setDefaultAddress(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        userProfileService.setDefaultAddress(jwt.getSubject(), id);
    }

    // ── Payment Methods ──────────────────────────────────────────────────────────

    @GetMapping("/payment-methods")
    public List<PaymentMethodResponse> getPaymentMethods(@AuthenticationPrincipal Jwt jwt) {
        return userProfileService.getPaymentMethods(jwt.getSubject());
    }

    @PostMapping("/payment-methods")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentMethodResponse addPaymentMethod(@AuthenticationPrincipal Jwt jwt,
                                                   @Valid @RequestBody SavePaymentMethodRequest req) {
        return userProfileService.addPaymentMethod(jwt.getSubject(), req);
    }

    @DeleteMapping("/payment-methods/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePaymentMethod(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        userProfileService.deletePaymentMethod(jwt.getSubject(), id);
    }

    @PutMapping("/payment-methods/{id}/default")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void setDefaultPaymentMethod(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        userProfileService.setDefaultPaymentMethod(jwt.getSubject(), id);
    }
}
