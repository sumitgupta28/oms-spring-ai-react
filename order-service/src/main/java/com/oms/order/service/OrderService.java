package com.oms.order.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.oms.order.dto.request.CreateOrderRequest;
import com.oms.order.dto.response.OrderResponse;
import com.oms.order.entity.Order;
import com.oms.order.entity.OrderItem;
import com.oms.order.exception.OrderNotFoundException;
import com.oms.order.repository.OrderRepository;
import com.oms.shared.dto.OrderItemDto;
import com.oms.shared.enums.OrderStatus;
import com.oms.shared.events.order.OrderCancelledEvent;
import com.oms.shared.events.order.OrderConfirmedEvent;
import com.oms.shared.events.order.OrderCreatedEvent;
import com.oms.shared.events.payment.PaymentFailedEvent;
import com.oms.shared.events.payment.PaymentSucceededEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderService {

    private final OrderRepository orderRepository;
    private final OutboxService outboxService;
    private final ObjectMapper objectMapper;

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest req, UUID customerId) {
        BigDecimal total = req.getItems().stream()
                .map(i -> i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Order order = Order.builder()
                .customerId(customerId)
                .status(OrderStatus.PENDING)
                .totalAmount(total)
                .shippingAddress(req.getShippingAddress())
                .build();

        req.getItems().forEach(i -> {
            OrderItem item = OrderItem.builder()
                    .order(order)
                    .productId(i.getProductId())
                    .productName(i.getProductName())
                    .quantity(i.getQuantity())
                    .unitPrice(i.getUnitPrice())
                    .build();
            order.getItems().add(item);
        });

        Order saved = orderRepository.save(order);

        List<OrderItemDto> itemDtos = saved.getItems().stream()
                .map(i -> OrderItemDto.builder()
                        .productId(i.getProductId())
                        .productName(i.getProductName())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice())
                        .build())
                .toList();

        outboxService.saveEvent("ORDER", saved.getId(), "OrderCreatedEvent",
                OrderCreatedEvent.builder()
                        .orderId(saved.getId())
                        .customerId(customerId)
                        .items(itemDtos)
                        .totalAmount(total)
                        .shippingAddress(req.getShippingAddress())
                        .createdAt(Instant.now())
                        .build());

        log.info("Order {} created with status PENDING for customer {}", saved.getId(), customerId);
        return toResponse(saved);
    }

    @Transactional
    public void confirmOrder(PaymentSucceededEvent event) {
        Order order = findOrThrow(event.getOrderId());
        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);

        outboxService.saveEvent("ORDER", order.getId(), "OrderConfirmedEvent",
                OrderConfirmedEvent.builder()
                        .orderId(order.getId())
                        .customerId(order.getCustomerId())
                        .totalAmount(order.getTotalAmount())
                        .confirmedAt(Instant.now())
                        .build());

        log.info("Order {} CONFIRMED", order.getId());
    }

    @Transactional
    public void cancelOrder(PaymentFailedEvent event) {
        Order order = findOrThrow(event.getOrderId());
        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);

        List<OrderItemDto> itemDtos = order.getItems().stream()
                .map(i -> OrderItemDto.builder()
                        .productId(i.getProductId())
                        .productName(i.getProductName())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice())
                        .build())
                .toList();

        outboxService.saveEvent("ORDER", order.getId(), "OrderCancelledEvent",
                OrderCancelledEvent.builder()
                        .orderId(order.getId())
                        .customerId(order.getCustomerId())
                        .reason(event.getFailureReason())
                        .items(itemDtos)
                        .cancelledAt(Instant.now())
                        .build());

        log.info("Order {} CANCELLED — reason: {}", order.getId(), event.getFailureReason());
    }

    public OrderResponse getOrder(UUID orderId) {
        return toResponse(findOrThrow(orderId));
    }

    public Page<OrderResponse> getMyOrders(UUID customerId, Pageable pageable) {
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId, pageable)
                .map(this::toResponse);
    }

    public Page<OrderResponse> getAllOrders(Pageable pageable) {
        return orderRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::toResponse);
    }

    private Order findOrThrow(UUID id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException(id));
    }

    private OrderResponse toResponse(Order o) {
        List<OrderResponse.OrderItemResponse> items = o.getItems().stream()
                .map(i -> OrderResponse.OrderItemResponse.builder()
                        .id(i.getId())
                        .productId(i.getProductId())
                        .productName(i.getProductName())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice())
                        .subtotal(i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                        .build())
                .toList();

        return OrderResponse.builder()
                .id(o.getId())
                .customerId(o.getCustomerId())
                .status(o.getStatus())
                .totalAmount(o.getTotalAmount())
                .shippingAddress(o.getShippingAddress())
                .items(items)
                .createdAt(o.getCreatedAt())
                .updatedAt(o.getUpdatedAt())
                .build();
    }
}
