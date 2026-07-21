package com.nageoffer.ai.ragent.deals.controller.request;

import lombok.Data;

import java.util.List;

@Data
public class ReferralDealBulkUpsertRequest {

    private List<ReferralDealSaveRequest> items;
}
