package com.oms.user.repository;

import com.oms.user.entity.UserPaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserPaymentMethodRepository extends JpaRepository<UserPaymentMethod, UUID> {
    List<UserPaymentMethod> findByKeycloakIdOrderByIsDefaultDescCreatedAtDesc(String keycloakId);
    Optional<UserPaymentMethod> findByIdAndKeycloakId(UUID id, String keycloakId);

    @Modifying
    @Query("UPDATE UserPaymentMethod p SET p.isDefault = false WHERE p.keycloakId = :keycloakId")
    void clearDefaultForUser(String keycloakId);
}
