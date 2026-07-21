package com.nageoffer.ai.ragent.deals.controller.request;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ReferralDealSaveRequest {

    private String id;

    private BigDecimal siteRebateUsd;

    private String siteRebateLabelZh;

    private String siteRebateLabelEn;

    /**
     * ReferralProgram 结构 JSON 字符串
     */
    private String programJson;

    private Integer sortOrder;

    private Integer published;
}
