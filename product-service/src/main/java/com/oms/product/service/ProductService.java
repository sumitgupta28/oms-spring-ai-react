package com.oms.product.service;

import com.oms.product.dto.request.CreateProductRequest;
import com.oms.product.dto.response.ProductResponse;
import com.oms.product.entity.Inventory;
import com.oms.product.entity.Product;
import com.oms.product.exception.ProductNotFoundException;
import com.oms.product.repository.InventoryRepository;
import com.oms.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;

    public Page<ProductResponse> listProducts(String category, String search, Pageable pageable) {
        Page<Product> products;
        if (search != null && !search.isBlank()) {
            products = productRepository.findByNameContainingIgnoreCaseAndActiveTrue(search, pageable);
        } else if (category != null && !category.isBlank()) {
            products = productRepository.findByCategoryAndActiveTrue(category, pageable);
        } else {
            products = productRepository.findByActiveTrue(pageable);
        }
        return products.map(this::toResponse);
    }

    public Page<ProductResponse> listByVendor(UUID vendorId, Pageable pageable) {
        return productRepository.findByVendorIdAndActiveTrue(vendorId, pageable).map(this::toResponse);
    }

    public ProductResponse getProduct(UUID id) {
        return productRepository.findById(id)
                .filter(Product::isActive)
                .map(this::toResponse)
                .orElseThrow(() -> new ProductNotFoundException(id));
    }

    @Transactional
    public ProductResponse createProduct(CreateProductRequest req, UUID vendorId) {
        Product product = Product.builder()
                .name(req.getName())
                .description(req.getDescription())
                .price(req.getPrice())
                .category(req.getCategory())
                .sku(req.getSku())
                .imageUrl(req.getImageUrl())
                .vendorId(vendorId)
                .active(true)
                .build();

        Product saved = productRepository.save(product);

        Inventory inventory = Inventory.builder()
                .product(saved)
                .quantity(req.getInitialQuantity())
                .reservedQuantity(0)
                .build();
        inventoryRepository.save(inventory);

        log.info("Created product {} with SKU {}", saved.getId(), saved.getSku());
        return toResponse(saved);
    }

    @Transactional
    public ProductResponse updateProduct(UUID id, CreateProductRequest req) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
        product.setName(req.getName());
        product.setDescription(req.getDescription());
        product.setPrice(req.getPrice());
        product.setCategory(req.getCategory());
        product.setImageUrl(req.getImageUrl());
        return toResponse(productRepository.save(product));
    }

    @Transactional
    public void deactivateProduct(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
        product.setActive(false);
        productRepository.save(product);
        log.info("Deactivated product {}", id);
    }

    private ProductResponse toResponse(Product p) {
        int available = inventoryRepository.findByProductId(p.getId())
                .map(inv -> inv.getQuantity() - inv.getReservedQuantity())
                .orElse(0);
        return ProductResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .price(p.getPrice())
                .category(p.getCategory())
                .sku(p.getSku())
                .imageUrl(p.getImageUrl())
                .vendorId(p.getVendorId())
                .active(p.isActive())
                .availableQuantity(available)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
