package com.oms.order.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class CreateOrderRequest {

    @NotEmpty
    @Valid
    private List<OrderItemRequest> items;

    @NotBlank
    private String shippingAddress;

    @Data
    public static class OrderItemRequest {
        @NotNull
        private UUID productId;

        @NotBlank
        private String productName;

        @Min(1)
        private int quantity;

        @NotNull
        @DecimalMin("0.01")
        private BigDecimal unitPrice;
    }
}
