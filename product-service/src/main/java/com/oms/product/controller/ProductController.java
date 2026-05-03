package com.oms.product.controller;

import com.oms.product.dto.request.CreateProductRequest;
import com.oms.product.dto.response.ImportResultResponse;
import com.oms.product.dto.response.ProductResponse;
import com.oms.product.service.ProductImportService;
import com.oms.product.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final ProductImportService productImportService;

    @GetMapping
    public Page<ProductResponse> list(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable) {
        return productService.listProducts(category, search, pageable);
    }

    @GetMapping("/{id}")
    public ProductResponse get(@PathVariable UUID id) {
        return productService.getProduct(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'VENDOR')")
    public ProductResponse create(
            @Valid @RequestBody CreateProductRequest req,
            @AuthenticationPrincipal Jwt jwt) {
        UUID vendorId = UUID.fromString(jwt.getSubject());
        return productService.createProduct(req, vendorId);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'VENDOR')")
    public ProductResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateProductRequest req) {
        return productService.updateProduct(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN', 'VENDOR')")
    public void deactivate(@PathVariable UUID id) {
        productService.deactivateProduct(id);
    }

    @GetMapping("/vendor/mine")
    @PreAuthorize("hasAnyRole('VENDOR', 'ADMIN')")
    public Page<ProductResponse> myProducts(
            @AuthenticationPrincipal Jwt jwt,
            @PageableDefault(size = 20) Pageable pageable) {
        UUID vendorId = UUID.fromString(jwt.getSubject());
        return productService.listByVendor(vendorId, pageable);
    }

    @PostMapping("/import")
    @PreAuthorize("hasAnyRole('ADMIN', 'VENDOR')")
    public ImportResultResponse importProducts(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal Jwt jwt) {
        UUID vendorId = UUID.fromString(jwt.getSubject());
        return productImportService.importProducts(file, vendorId);
    }
}
