package com.oms.user.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class AddressResponse {
    private UUID id;
    private String label;
    private String fullName;
    private String street;
    private String city;
    private String state;
    private String zipCode;
    private String country;
    private String phone;
    private boolean isDefault;
    private Instant createdAt;
}
