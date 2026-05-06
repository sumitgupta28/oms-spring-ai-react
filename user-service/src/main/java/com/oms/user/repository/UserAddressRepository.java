package com.oms.user.repository;

import com.oms.user.entity.UserAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserAddressRepository extends JpaRepository<UserAddress, UUID> {
    List<UserAddress> findByKeycloakIdOrderByIsDefaultDescCreatedAtDesc(String keycloakId);
    Optional<UserAddress> findByIdAndKeycloakId(UUID id, String keycloakId);

    @Modifying
    @Query("UPDATE UserAddress a SET a.isDefault = false WHERE a.keycloakId = :keycloakId")
    void clearDefaultForUser(String keycloakId);
}
