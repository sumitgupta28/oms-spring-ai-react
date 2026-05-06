package com.oms.user.repository;

import com.oms.user.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, UUID> {
    Optional<UserProfile> findByKeycloakId(String keycloakId);
    boolean existsByKeycloakId(String keycloakId);
}
