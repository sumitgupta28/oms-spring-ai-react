package com.oms.shared.events.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderConfirmedEvent {
    private UUID orderId;
    private UUID customerId;
    private BigDecimal totalAmount;
    private Instant confirmedAt;
}
