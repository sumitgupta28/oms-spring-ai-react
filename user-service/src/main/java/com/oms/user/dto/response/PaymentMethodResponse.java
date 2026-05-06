package com.oms.user.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class PaymentMethodResponse {
    private UUID id;
    private String nickname;
    private String cardType;
    private String lastFour;
    private int expiryMonth;
    private int expiryYear;
    private boolean isDefault;
    private Instant createdAt;
}
