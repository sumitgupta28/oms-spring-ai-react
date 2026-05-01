package com.oms.payment.dto.response;

import com.oms.shared.enums.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class PaymentResponse {
    private UUID id;
    private UUID orderId;
    private BigDecimal amount;
    private PaymentStatus status;
    private String transactionRef;
    private String failureReason;
    private Instant createdAt;
    private Instant updatedAt;
}
