package com.nageoffer.ai.ragent.jobintel.controller.request;

import lombok.Data;

@Data
public class JobIntelDocumentSubmitRequest {
    private String kind;
    private String title;
    private String body;
}
