package com.oms.user.service;

import com.oms.user.dto.request.AdminCreateUserRequest;
import com.oms.user.dto.request.RegisterRequest;
import com.oms.user.dto.response.UserResponse;
import com.oms.user.dto.response.UserStatsResponse;
import com.oms.user.exception.ConflictException;
import com.oms.user.exception.NotFoundException;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class KeycloakUserService {

    private final Keycloak keycloak;

    @Value("${keycloak.admin.realm}")
    private String realm;

    public String createCustomer(RegisterRequest req) {
        return createKeycloakUser(
                req.getEmail(),
                req.getFirstName(),
                req.getLastName(),
                req.getPassword(),
                "ROLE_CUSTOMER",
                false
        );
    }

    public String createUserByAdmin(AdminCreateUserRequest req) {
        return createKeycloakUser(
                req.getEmail(),
                req.getFirstName(),
                req.getLastName(),
                null,
                req.getRole(),
                true
        );
    }

    private String createKeycloakUser(String email, String firstName, String lastName,
                                       String password, String role, boolean sendInvitation) {
        RealmResource realmResource = keycloak.realm(realm);

        List<UserRepresentation> existing = realmResource.users().searchByEmail(email, true);
        if (!existing.isEmpty()) {
            throw new ConflictException("An account with this email already exists.");
        }

        UserRepresentation user = new UserRepresentation();
        user.setUsername(email);
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEnabled(true);
        user.setEmailVerified(!sendInvitation);

        if (password != null) {
            CredentialRepresentation credential = new CredentialRepresentation();
            credential.setType(CredentialRepresentation.PASSWORD);
            credential.setValue(password);
            credential.setTemporary(false);
            user.setCredentials(List.of(credential));
        }

        if (sendInvitation) {
            user.setRequiredActions(List.of("UPDATE_PASSWORD"));
        }

        try (Response response = realmResource.users().create(user)) {
            if (response.getStatus() != 201) {
                log.error("Keycloak user creation failed: status={}", response.getStatus());
                throw new RuntimeException("Failed to create user in Keycloak");
            }

            String userId = extractCreatedId(response);
            assignRole(realmResource, userId, role);

            if (sendInvitation) {
                sendInvitationEmail(realmResource, userId);
            }

            return userId;
        }
    }

    public void triggerPasswordReset(String email) {
        RealmResource realmResource = keycloak.realm(realm);
        List<UserRepresentation> users = realmResource.users().searchByEmail(email, true);
        if (users.isEmpty()) {
            // Don't reveal whether the email exists
            log.info("Password reset requested for unknown email (no action taken)");
            return;
        }
        UserRepresentation user = users.get(0);
        realmResource.users().get(user.getId())
                .executeActionsEmail(List.of("UPDATE_PASSWORD"));
    }

    public void updateUserStatus(String userId, String status) {
        RealmResource realmResource = keycloak.realm(realm);
        UserResource userResource = realmResource.users().get(userId);
        UserRepresentation user = userResource.toRepresentation();
        user.setEnabled("ACTIVE".equals(status));
        userResource.update(user);
    }

    public void updateUserRoles(String userId, String newRole) {
        RealmResource realmResource = keycloak.realm(realm);
        List<String> allRoles = List.of("ROLE_ADMIN", "ROLE_CUSTOMER", "ROLE_VENDOR", "ROLE_SUPPORT");
        UserResource userResource = realmResource.users().get(userId);

        List<RoleRepresentation> toRemove = allRoles.stream()
                .map(r -> realmResource.roles().get(r).toRepresentation())
                .toList();
        userResource.roles().realmLevel().remove(toRemove);

        RoleRepresentation role = realmResource.roles().get(newRole).toRepresentation();
        userResource.roles().realmLevel().add(List.of(role));
    }

    public List<UserRepresentation> listUsers(String statusFilter, String roleFilter) {
        RealmResource realmResource = keycloak.realm(realm);
        List<UserRepresentation> all = realmResource.users().list(0, Integer.MAX_VALUE);

        return all.stream()
                .filter(u -> filterByStatus(u, statusFilter))
                .filter(u -> filterByRole(realmResource, u, roleFilter))
                .toList();
    }

    public UserRepresentation getUserById(String userId) {
        try {
            return keycloak.realm(realm).users().get(userId).toRepresentation();
        } catch (Exception e) {
            throw new NotFoundException("User not found: " + userId);
        }
    }

    public UserStatsResponse computeStats() {
        List<UserRepresentation> all = keycloak.realm(realm).users().list(0, Integer.MAX_VALUE);
        Instant monthAgo = Instant.now().minus(30, ChronoUnit.DAYS);

        long active = all.stream().filter(u -> Boolean.TRUE.equals(u.isEnabled()) && Boolean.TRUE.equals(u.isEmailVerified())).count();
        long suspended = all.stream().filter(u -> !Boolean.TRUE.equals(u.isEnabled())).count();
        long pendingVerify = all.stream().filter(u -> Boolean.TRUE.equals(u.isEnabled()) && !Boolean.TRUE.equals(u.isEmailVerified())).count();
        long thisMonth = all.stream()
                .filter(u -> u.getCreatedTimestamp() != null)
                .filter(u -> Instant.ofEpochMilli(u.getCreatedTimestamp()).isAfter(monthAgo))
                .count();

        return UserStatsResponse.builder()
                .total(all.size())
                .active(active)
                .suspended(suspended)
                .pendingVerify(pendingVerify)
                .thisMonth(thisMonth)
                .build();
    }

    public String getPrimaryRole(RealmResource realmResource, String userId) {
        try {
            return realmResource.users().get(userId).roles().realmLevel().listEffective()
                    .stream()
                    .map(RoleRepresentation::getName)
                    .filter(r -> r.startsWith("ROLE_"))
                    .findFirst()
                    .orElse("ROLE_CUSTOMER");
        } catch (Exception e) {
            return "ROLE_CUSTOMER";
        }
    }

    public RealmResource realmResource() {
        return keycloak.realm(realm);
    }

    private void assignRole(RealmResource realmResource, String userId, String roleName) {
        RoleRepresentation role = realmResource.roles().get(roleName).toRepresentation();
        realmResource.users().get(userId).roles().realmLevel().add(List.of(role));
    }

    private void sendInvitationEmail(RealmResource realmResource, String userId) {
        realmResource.users().get(userId).executeActionsEmail(List.of("UPDATE_PASSWORD"));
    }

    private String extractCreatedId(Response response) {
        String location = response.getLocation().toString();
        return location.substring(location.lastIndexOf('/') + 1);
    }

    private boolean filterByStatus(UserRepresentation user, String statusFilter) {
        if (statusFilter == null || statusFilter.isBlank() || "ALL".equalsIgnoreCase(statusFilter)) return true;
        return switch (statusFilter.toUpperCase()) {
            case "ACTIVE" -> Boolean.TRUE.equals(user.isEnabled()) && Boolean.TRUE.equals(user.isEmailVerified());
            case "PENDING" -> Boolean.TRUE.equals(user.isEnabled()) && !Boolean.TRUE.equals(user.isEmailVerified());
            case "SUSPENDED" -> !Boolean.TRUE.equals(user.isEnabled());
            default -> true;
        };
    }

    private boolean filterByRole(RealmResource realmResource, UserRepresentation user, String roleFilter) {
        if (roleFilter == null || roleFilter.isBlank() || "ALL".equalsIgnoreCase(roleFilter)) return true;
        String primaryRole = getPrimaryRole(realmResource, user.getId());
        return primaryRole.equalsIgnoreCase(roleFilter);
    }
}
