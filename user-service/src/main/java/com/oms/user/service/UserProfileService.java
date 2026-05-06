package com.oms.user.service;

import com.oms.user.dto.request.SaveAddressRequest;
import com.oms.user.dto.request.SavePaymentMethodRequest;
import com.oms.user.dto.response.AddressResponse;
import com.oms.user.dto.response.PaymentMethodResponse;
import com.oms.user.entity.UserAddress;
import com.oms.user.entity.UserPaymentMethod;
import com.oms.user.entity.UserProfile;
import com.oms.user.exception.NotFoundException;
import com.oms.user.repository.UserAddressRepository;
import com.oms.user.repository.UserPaymentMethodRepository;
import com.oms.user.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserProfileService {

    private final UserProfileRepository profileRepository;
    private final UserAddressRepository addressRepository;
    private final UserPaymentMethodRepository paymentRepository;

    @Transactional
    public void createProfile(String keycloakId) {
        if (!profileRepository.existsByKeycloakId(keycloakId)) {
            profileRepository.save(UserProfile.builder().keycloakId(keycloakId).build());
        }
    }

    // ── Addresses ────────────────────────────────────────────────────────────────

    public List<AddressResponse> getAddresses(String keycloakId) {
        return addressRepository.findByKeycloakIdOrderByIsDefaultDescCreatedAtDesc(keycloakId)
                .stream().map(this::toAddressResponse).toList();
    }

    @Transactional
    public AddressResponse addAddress(String keycloakId, SaveAddressRequest req) {
        if (req.isDefault()) {
            addressRepository.clearDefaultForUser(keycloakId);
        }
        UserAddress address = UserAddress.builder()
                .keycloakId(keycloakId)
                .label(req.getLabel())
                .fullName(req.getFullName())
                .street(req.getStreet())
                .city(req.getCity())
                .state(req.getState())
                .zipCode(req.getZipCode())
                .country(req.getCountry())
                .phone(req.getPhone())
                .isDefault(req.isDefault())
                .build();
        return toAddressResponse(addressRepository.save(address));
    }

    @Transactional
    public AddressResponse updateAddress(String keycloakId, UUID addressId, SaveAddressRequest req) {
        UserAddress address = addressRepository.findByIdAndKeycloakId(addressId, keycloakId)
                .orElseThrow(() -> new NotFoundException("Address not found"));
        if (req.isDefault()) {
            addressRepository.clearDefaultForUser(keycloakId);
        }
        address.setLabel(req.getLabel());
        address.setFullName(req.getFullName());
        address.setStreet(req.getStreet());
        address.setCity(req.getCity());
        address.setState(req.getState());
        address.setZipCode(req.getZipCode());
        address.setCountry(req.getCountry());
        address.setPhone(req.getPhone());
        address.setDefault(req.isDefault());
        return toAddressResponse(addressRepository.save(address));
    }

    @Transactional
    public void deleteAddress(String keycloakId, UUID addressId) {
        UserAddress address = addressRepository.findByIdAndKeycloakId(addressId, keycloakId)
                .orElseThrow(() -> new NotFoundException("Address not found"));
        addressRepository.delete(address);
    }

    @Transactional
    public void setDefaultAddress(String keycloakId, UUID addressId) {
        addressRepository.findByIdAndKeycloakId(addressId, keycloakId)
                .orElseThrow(() -> new NotFoundException("Address not found"));
        addressRepository.clearDefaultForUser(keycloakId);
        UserAddress address = addressRepository.findByIdAndKeycloakId(addressId, keycloakId).get();
        address.setDefault(true);
        addressRepository.save(address);
    }

    // ── Payment Methods ──────────────────────────────────────────────────────────

    public List<PaymentMethodResponse> getPaymentMethods(String keycloakId) {
        return paymentRepository.findByKeycloakIdOrderByIsDefaultDescCreatedAtDesc(keycloakId)
                .stream().map(this::toPaymentResponse).toList();
    }

    @Transactional
    public PaymentMethodResponse addPaymentMethod(String keycloakId, SavePaymentMethodRequest req) {
        if (req.isDefault()) {
            paymentRepository.clearDefaultForUser(keycloakId);
        }
        UserPaymentMethod method = UserPaymentMethod.builder()
                .keycloakId(keycloakId)
                .nickname(req.getNickname())
                .cardType(req.getCardType())
                .lastFour(req.getLastFour())
                .expiryMonth(req.getExpiryMonth())
                .expiryYear(req.getExpiryYear())
                .isDefault(req.isDefault())
                .build();
        return toPaymentResponse(paymentRepository.save(method));
    }

    @Transactional
    public void deletePaymentMethod(String keycloakId, UUID methodId) {
        UserPaymentMethod method = paymentRepository.findByIdAndKeycloakId(methodId, keycloakId)
                .orElseThrow(() -> new NotFoundException("Payment method not found"));
        paymentRepository.delete(method);
    }

    @Transactional
    public void setDefaultPaymentMethod(String keycloakId, UUID methodId) {
        paymentRepository.findByIdAndKeycloakId(methodId, keycloakId)
                .orElseThrow(() -> new NotFoundException("Payment method not found"));
        paymentRepository.clearDefaultForUser(keycloakId);
        UserPaymentMethod method = paymentRepository.findByIdAndKeycloakId(methodId, keycloakId).get();
        method.setDefault(true);
        paymentRepository.save(method);
    }

    // ── Mappers ──────────────────────────────────────────────────────────────────

    private AddressResponse toAddressResponse(UserAddress a) {
        return AddressResponse.builder()
                .id(a.getId())
                .label(a.getLabel())
                .fullName(a.getFullName())
                .street(a.getStreet())
                .city(a.getCity())
                .state(a.getState())
                .zipCode(a.getZipCode())
                .country(a.getCountry())
                .phone(a.getPhone())
                .isDefault(a.isDefault())
                .createdAt(a.getCreatedAt())
                .build();
    }

    private PaymentMethodResponse toPaymentResponse(UserPaymentMethod p) {
        return PaymentMethodResponse.builder()
                .id(p.getId())
                .nickname(p.getNickname())
                .cardType(p.getCardType())
                .lastFour(p.getLastFour())
                .expiryMonth(p.getExpiryMonth())
                .expiryYear(p.getExpiryYear())
                .isDefault(p.isDefault())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
