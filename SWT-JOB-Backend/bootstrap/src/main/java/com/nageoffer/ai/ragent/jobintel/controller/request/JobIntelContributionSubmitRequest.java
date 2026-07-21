package com.nageoffer.ai.ragent.jobintel.controller.request;

import lombok.Data;

@Data
public class JobIntelContributionSubmitRequest {
    private String jobId;
    private String state;
    private String jobTitle;
    private Double hourlyWage;
    private String notes;
}
