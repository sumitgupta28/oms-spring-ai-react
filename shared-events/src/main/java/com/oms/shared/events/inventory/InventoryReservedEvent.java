package com.oms.shared.events.inventory;

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
public class InventoryReservedEvent {
    private UUID orderId;
    private UUID customerId;
    private List<OrderItemDto> items;
    private BigDecimal totalAmount;
    private Instant reservedAt;
}
