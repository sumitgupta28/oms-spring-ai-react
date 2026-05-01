package com.oms.shared.events.payment;

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
public class PaymentSucceededEvent {
    private UUID orderId;
    private UUID customerId;
    private UUID paymentId;
    private BigDecimal amount;
    private String transactionRef;
    private Instant succeededAt;
}
