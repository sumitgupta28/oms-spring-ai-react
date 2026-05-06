package com.oms.user.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class UserResponse {
    private String id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String role;
    private String status;
    private boolean emailVerified;
    private boolean mfaEnabled;
    private Instant joinedAt;
    private Instant lastLoginAt;
    private String phone;
    private String avatarUrl;
}
