package com.oms.product.service;

import com.oms.product.dto.request.CreateProductRequest;
import com.oms.product.dto.response.ImportResultResponse;
import com.oms.product.exception.InvalidFileFormatException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class ProductImportService {

    private final ProductService productService;

    public ImportResultResponse importProducts(MultipartFile file, UUID vendorId) {
        List<ImportResultResponse.RowError> errors = new ArrayList<>();
        int succeeded = 0;
        int totalRows = 0;

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            int lastRow = sheet.getLastRowNum();
            totalRows = Math.max(0, lastRow); // row 0 is header

            for (int i = 1; i <= lastRow; i++) {
                Row row = sheet.getRow(i);
                if (row == null) {
                    totalRows--;
                    continue;
                }
                try {
                    CreateProductRequest req = parseRow(row);
                    productService.createProduct(req, vendorId);
                    succeeded++;
                } catch (Exception e) {
                    log.warn("Import row {} failed: {}", i + 1, e.getMessage());
                    errors.add(ImportResultResponse.RowError.builder()
                            .rowNumber(i + 1)
                            .reason(e.getMessage())
                            .build());
                }
            }
        } catch (IOException e) {
            throw new InvalidFileFormatException("Failed to parse file: " + e.getMessage(), e);
        }

        return ImportResultResponse.builder()
                .totalRows(totalRows)
                .succeeded(succeeded)
                .failed(errors.size())
                .errors(errors)
                .build();
    }

    private CreateProductRequest parseRow(Row row) {
        String name = requireCell(row, 0, "name");
        String sku = requireCell(row, 1, "sku");
        String priceStr = requireCell(row, 2, "price");
        String description = getCell(row, 3);
        String category = getCell(row, 4);
        String imageUrl = getCell(row, 5);
        String quantityStr = requireCell(row, 6, "initialQuantity");

        BigDecimal price;
        try {
            price = new BigDecimal(priceStr);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid price value: " + priceStr);
        }
        if (price.compareTo(new BigDecimal("0.01")) < 0) {
            throw new IllegalArgumentException("Price must be >= 0.01");
        }

        int quantity;
        try {
            quantity = Integer.parseInt(quantityStr);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid initialQuantity value: " + quantityStr);
        }
        if (quantity < 0) {
            throw new IllegalArgumentException("initialQuantity must be >= 0");
        }

        CreateProductRequest req = new CreateProductRequest();
        req.setName(name.length() > 255 ? name.substring(0, 255) : name);
        req.setSku(sku.length() > 100 ? sku.substring(0, 100) : sku);
        req.setPrice(price);
        req.setDescription(description);
        req.setCategory(category);
        req.setImageUrl(imageUrl);
        req.setInitialQuantity(quantity);
        return req;
    }

    private String requireCell(Row row, int col, String fieldName) {
        String value = getCell(row, col);
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
        return value.trim();
    }

    private String getCell(Row row, int col) {
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                double val = cell.getNumericCellValue();
                if (val == Math.floor(val) && !Double.isInfinite(val)) {
                    yield String.valueOf((long) val);
                }
                yield String.valueOf(val);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> null;
        };
    }
}
