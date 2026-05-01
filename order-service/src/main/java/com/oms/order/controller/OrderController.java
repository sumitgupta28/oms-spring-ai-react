package com.oms.order.controller;

import com.oms.order.dto.request.CreateOrderRequest;
import com.oms.order.dto.response.OrderResponse;
import com.oms.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public OrderResponse createOrder(
            @Valid @RequestBody CreateOrderRequest req,
            @AuthenticationPrincipal Jwt jwt) {
        UUID customerId = UUID.fromString(jwt.getSubject());
        return orderService.createOrder(req, customerId);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public OrderResponse getOrder(@PathVariable UUID id) {
        return orderService.getOrder(id);
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public Page<OrderResponse> myOrders(
            @AuthenticationPrincipal Jwt jwt,
            @PageableDefault(size = 20) Pageable pageable) {
        UUID customerId = UUID.fromString(jwt.getSubject());
        return orderService.getMyOrders(customerId, pageable);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT')")
    public Page<OrderResponse> allOrders(@PageableDefault(size = 20) Pageable pageable) {
        return orderService.getAllOrders(pageable);
    }
}
