package com.oms.product.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ProductResponse {
    private UUID id;
    private String name;
    private String description;
    private BigDecimal price;
    private String category;
    private String sku;
    private String imageUrl;
    private UUID vendorId;
    private boolean active;
    private int availableQuantity;
    private Instant createdAt;
    private Instant updatedAt;
}
