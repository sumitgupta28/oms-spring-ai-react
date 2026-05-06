package com.oms.user.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_payment_methods")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPaymentMethod {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "keycloak_id", nullable = false, length = 36)
    private String keycloakId;

    @Column(length = 50)
    private String nickname;

    @Column(name = "card_type", nullable = false, length = 20)
    private String cardType;

    @Column(name = "last_four", nullable = false, length = 4)
    private String lastFour;

    @Column(name = "expiry_month", nullable = false)
    private int expiryMonth;

    @Column(name = "expiry_year", nullable = false)
    private int expiryYear;

    @Column(name = "is_default", nullable = false)
    private boolean isDefault;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
