package com.oms.shared.events.payment;

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
public class PaymentFailedEvent {
    private UUID orderId;
    private UUID customerId;
    private String failureReason;
    private List<OrderItemDto> items;
    private Instant failedAt;
}
