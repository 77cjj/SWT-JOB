package com.nageoffer.ai.ragent.jobintel.controller.vo;

import lombok.Builder;
import lombok.Data;

import java.util.Date;

@Data
@Builder
public class JobIntelContributionVO {
    private String id;
    private String jobId;
    private String submitterId;
    private String stateCode;
    private String jobTitle;
    private Double hourlyWage;
    private String notes;
    private String status;
    private String adminSummary;
    private Boolean published;
    private Date createTime;
    private Date updateTime;
}
