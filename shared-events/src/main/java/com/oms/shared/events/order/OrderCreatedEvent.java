package com.oms.shared.events.order;

import com.oms.shared.dto.OrderItemDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderCreatedEvent {
    private UUID orderId;
    private UUID customerId;
    private List<OrderItemDto> items;
    private BigDecimal totalAmount;
    private String shippingAddress;
    private Instant createdAt;
}
