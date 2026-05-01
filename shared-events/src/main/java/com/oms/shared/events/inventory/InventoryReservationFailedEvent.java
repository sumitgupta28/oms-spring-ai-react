package com.oms.shared.events.inventory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryReservationFailedEvent {
    private UUID orderId;
    private UUID customerId;
    private String reason;
    private Instant failedAt;
}
