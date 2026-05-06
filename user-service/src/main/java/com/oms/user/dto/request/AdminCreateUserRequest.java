package com.oms.user.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class AdminCreateUserRequest {

    @NotBlank
    private String firstName;

    @NotBlank
    private String lastName;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Pattern(regexp = "ROLE_CUSTOMER|ROLE_VENDOR|ROLE_SUPPORT", message = "Role must be ROLE_CUSTOMER, ROLE_VENDOR, or ROLE_SUPPORT")
    private String role;
}
