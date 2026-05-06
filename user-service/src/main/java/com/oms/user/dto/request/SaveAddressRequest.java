package com.oms.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SaveAddressRequest {

    @NotBlank
    @Size(max = 50)
    private String label;

    @NotBlank
    @Size(max = 100)
    private String fullName;

    @NotBlank
    @Size(max = 200)
    private String street;

    @NotBlank
    @Size(max = 100)
    private String city;

    @NotBlank
    @Size(max = 100)
    private String state;

    @NotBlank
    @Size(max = 20)
    private String zipCode;

    @NotBlank
    @Size(max = 100)
    private String country;

    @Size(max = 20)
    private String phone;

    private boolean isDefault;
}
