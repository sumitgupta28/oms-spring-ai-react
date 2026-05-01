package com.oms.product.controller;

import com.oms.product.dto.request.UpdateInventoryRequest;
import com.oms.product.dto.response.InventoryResponse;
import com.oms.product.entity.Inventory;
import com.oms.product.exception.ProductNotFoundException;
import com.oms.product.repository.InventoryRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryRepository inventoryRepository;

    @GetMapping("/{productId}")
    public InventoryResponse get(@PathVariable UUID productId) {
        Inventory inv = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));
        return toResponse(inv);
    }

    @PutMapping("/{productId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'VENDOR')")
    public InventoryResponse update(
            @PathVariable UUID productId,
            @Valid @RequestBody UpdateInventoryRequest req) {
        Inventory inv = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));
        inv.setQuantity(req.getQuantity());
        return toResponse(inventoryRepository.save(inv));
    }

    private InventoryResponse toResponse(Inventory inv) {
        return InventoryResponse.builder()
                .productId(inv.getProduct().getId())
                .quantity(inv.getQuantity())
                .reservedQuantity(inv.getReservedQuantity())
                .availableQuantity(inv.getQuantity() - inv.getReservedQuantity())
                .build();
    }
}
