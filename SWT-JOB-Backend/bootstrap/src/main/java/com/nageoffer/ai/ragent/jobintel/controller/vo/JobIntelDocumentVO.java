package com.nageoffer.ai.ragent.jobintel.controller.vo;

import lombok.Builder;
import lombok.Data;

import java.util.Date;

@Data
@Builder
public class JobIntelDocumentVO {
    private String id;
    private String jobId;
    private String kind;
    private String title;
    private String body;
    private String uploaderId;
    private String status;
    private Date createTime;
    private Date updateTime;
}
