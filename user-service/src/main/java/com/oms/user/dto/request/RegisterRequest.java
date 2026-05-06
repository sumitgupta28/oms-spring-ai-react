package com.oms.user.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank
    @Size(min = 1, max = 50)
    private String firstName;

    @NotBlank
    @Size(min = 1, max = 50)
    private String lastName;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 8, max = 128, message = "Password must be at least 8 characters")
    @Pattern(regexp = ".*\\d.*", message = "Password must contain at least one digit")
    private String password;
}
