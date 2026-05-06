package com.oms.user.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class SavePaymentMethodRequest {

    @Size(max = 50)
    private String nickname;

    @NotBlank
    @Pattern(regexp = "VISA|MASTERCARD|AMEX|DISCOVER", message = "Card type must be VISA, MASTERCARD, AMEX, or DISCOVER")
    private String cardType;

    @NotBlank
    @Pattern(regexp = "\\d{4}", message = "Last four must be exactly 4 digits")
    private String lastFour;

    @Min(1) @Max(12)
    private int expiryMonth;

    @Min(2024) @Max(2040)
    private int expiryYear;

    private boolean isDefault;
}
