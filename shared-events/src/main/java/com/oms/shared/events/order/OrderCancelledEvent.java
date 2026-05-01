package com.oms.shared.events.order;

import com.oms.shared.dto.OrderItemDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderCancelledEvent {
    private UUID orderId;
    private UUID customerId;
    private String reason;
    private List<OrderItemDto> items;
    private Instant cancelledAt;
}
