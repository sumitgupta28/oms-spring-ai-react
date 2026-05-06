package com.oms.user.controller;

import com.oms.user.dto.request.AdminCreateUserRequest;
import com.oms.user.dto.response.UserResponse;
import com.oms.user.dto.response.UserStatsResponse;
import com.oms.user.service.KeycloakUserService;
import com.oms.user.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ROLE_ADMIN')")
public class AdminUserController {

    private final KeycloakUserService keycloakUserService;
    private final UserProfileService userProfileService;

    @GetMapping("/stats")
    public UserStatsResponse getStats() {
        return keycloakUserService.computeStats();
    }

    @GetMapping
    public List<UserResponse> listUsers(
            @RequestParam(defaultValue = "ALL") String status,
            @RequestParam(defaultValue = "ALL") String role) {
        RealmResource realmResource = keycloakUserService.realmResource();
        return keycloakUserService.listUsers(status, role).stream()
                .map(u -> toUserResponse(u, realmResource))
                .toList();
    }

    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable String id) {
        RealmResource realmResource = keycloakUserService.realmResource();
        return toUserResponse(keycloakUserService.getUserById(id), realmResource);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> createUser(@Valid @RequestBody AdminCreateUserRequest req) {
        String keycloakId = keycloakUserService.createUserByAdmin(req);
        userProfileService.createProfile(keycloakId);
        return Map.of("id", keycloakId, "message", "User created. Invitation email sent.");
    }

    @PutMapping("/{id}/status")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        keycloakUserService.updateUserStatus(id, body.get("status"));
    }

    @PutMapping("/{id}/roles")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateRoles(@PathVariable String id, @RequestBody Map<String, String> body) {
        keycloakUserService.updateUserRoles(id, body.get("role"));
    }

    private UserResponse toUserResponse(UserRepresentation u, RealmResource realmResource) {
        String primaryRole = keycloakUserService.getPrimaryRole(realmResource, u.getId());
        String status;
        if (!Boolean.TRUE.equals(u.isEnabled())) {
            status = "SUSPENDED";
        } else if (!Boolean.TRUE.equals(u.isEmailVerified())) {
            status = "PENDING";
        } else {
            status = "ACTIVE";
        }

        boolean mfaEnabled = u.getRequiredActions() != null &&
                !u.getRequiredActions().isEmpty() ||
                (u.getAttributes() != null && u.getAttributes().containsKey("totp"));

        return UserResponse.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .firstName(u.getFirstName())
                .lastName(u.getLastName())
                .role(primaryRole)
                .status(status)
                .emailVerified(Boolean.TRUE.equals(u.isEmailVerified()))
                .mfaEnabled(false)
                .joinedAt(u.getCreatedTimestamp() != null ? Instant.ofEpochMilli(u.getCreatedTimestamp()) : null)
                .lastLoginAt(null)
                .build();
    }
}
