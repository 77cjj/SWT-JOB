/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.nageoffer.ai.ragent.siteinquiry.controller;

import cn.dev33.satoken.annotation.SaIgnore;
import cn.hutool.core.util.StrUtil;
import com.nageoffer.ai.ragent.framework.convention.Result;
import com.nageoffer.ai.ragent.framework.exception.ClientException;
import com.nageoffer.ai.ragent.framework.web.Results;
import com.nageoffer.ai.ragent.siteinquiry.config.SiteInquiryProperties;
import com.nageoffer.ai.ragent.siteinquiry.controller.request.SiteInquiryRequest;
import com.nageoffer.ai.ragent.siteinquiry.service.SiteInquiryService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * 站点留言 Webhook：供 Vercel /api/site-inquiry 转发，推送到企业微信群机器人。
 */
@RestController
@RequiredArgsConstructor
@SaIgnore
public class SiteInquiryPublicController {

    private static final String SECRET_HEADER = "X-Site-Inquiry-Secret";

    private final SiteInquiryService siteInquiryService;
    private final SiteInquiryProperties properties;

    /**
     * 推荐 {@code /auth/site-inquiry-webhook}：与登录接口同属 {@code /auth/**}，Sa-Token 白名单稳定生效。
     * {@code /public/site-inquiry} 保留兼容旧配置。
     */
    @PostMapping({"/auth/site-inquiry-webhook", "/public/site-inquiry"})
    public Result<Void> acceptInquiry(@RequestBody SiteInquiryRequest body, HttpServletRequest request) {
        verifySharedSecret(request);
        siteInquiryService.forwardToWeWork(body);
        return Results.success();
    }

    /** 无需登录，用于确认后端版本与企微 Webhook 是否已配置 */
    @GetMapping({"/auth/site-inquiry-ping", "/public/site-inquiry-ping"})
    public Result<SiteInquiryPingVO> ping() {
        return Results.success(
                SiteInquiryPingVO.builder()
                        .ok(true)
                        .weworkConfigured(StrUtil.isNotBlank(properties.getWeworkWebhookUrl()))
                        .secretRequired(StrUtil.isNotBlank(properties.getWebhookSecret()))
                        .build());
    }

    private void verifySharedSecret(HttpServletRequest request) {
        String configured = StrUtil.trimToEmpty(properties.getWebhookSecret());
        if (StrUtil.isBlank(configured)) {
            return;
        }
        String provided = StrUtil.trimToEmpty(request.getHeader(SECRET_HEADER));
        if (!configured.equals(provided)) {
            throw new ClientException("Webhook 鉴权失败");
        }
    }
}
