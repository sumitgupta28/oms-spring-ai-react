package com.oms.product.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateProductRequest {

    @NotBlank
    @Size(max = 255)
    private String name;

    private String description;

    @NotNull
    @DecimalMin("0.01")
    private BigDecimal price;

    private String category;

    @NotBlank
    @Size(max = 100)
    private String sku;

    private String imageUrl;

    @NotNull
    @Min(0)
    private Integer initialQuantity;
}
