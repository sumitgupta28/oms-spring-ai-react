package com.oms.user.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserStatsResponse {
    private long total;
    private long active;
    private long pendingVerify;
    private long suspended;
    private long thisMonth;
}
