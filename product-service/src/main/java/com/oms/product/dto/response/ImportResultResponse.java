package com.oms.product.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ImportResultResponse {
    private int totalRows;
    private int succeeded;
    private int failed;
    private List<RowError> errors;

    @Data
    @Builder
    public static class RowError {
        private int rowNumber;
        private String reason;
    }
}
