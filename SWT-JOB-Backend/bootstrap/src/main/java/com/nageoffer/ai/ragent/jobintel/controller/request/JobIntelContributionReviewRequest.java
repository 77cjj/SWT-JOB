package com.nageoffer.ai.ragent.jobintel.controller.request;

import lombok.Data;

@Data
public class JobIntelContributionReviewRequest {
    private String status;
    private String adminSummary;
    private Boolean published;
    private String jobId;
}
