package com.nageoffer.ai.ragent.deals.controller.vo;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ReferralDealVO {

    private String id;

    private BigDecimal siteRebateUsd;

    private String siteRebateLabelZh;

    private String siteRebateLabelEn;

    /**
     * 解析后的 ReferralProgram JSON 对象（Map/Json）
     */
    private Object program;

    private Integer sortOrder;

    private Integer published;
}
