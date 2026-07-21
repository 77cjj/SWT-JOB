package com.nageoffer.ai.ragent.jobintel.controller.request;

import lombok.Data;

@Data
public class JobIntelDocumentReviewRequest {
    private String status;
    private String title;
    private String body;
}
