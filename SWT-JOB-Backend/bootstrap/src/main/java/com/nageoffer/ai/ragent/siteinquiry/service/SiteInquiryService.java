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

package com.nageoffer.ai.ragent.siteinquiry.service;

import cn.hutool.core.util.StrUtil;
import cn.hutool.http.HttpUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.nageoffer.ai.ragent.framework.exception.ClientException;
import com.nageoffer.ai.ragent.siteinquiry.config.SiteInquiryProperties;
import com.nageoffer.ai.ragent.siteinquiry.controller.request.SiteInquiryRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class SiteInquiryService {

    private final SiteInquiryProperties properties;

    public void forwardToWeWork(SiteInquiryRequest request) {
        String webhook = StrUtil.trimToEmpty(properties.getWeworkWebhookUrl());
        if (StrUtil.isBlank(webhook)) {
            throw new ClientException("未配置 SITE_INQUIRY_WEWORK_WEBHOOK，请在服务器 .env 中设置企业微信机器人地址");
        }

        String message = StrUtil.trimToEmpty(request.getMessage());
        if (message.length() < 4) {
            throw new ClientException("留言内容太短");
        }
        if (message.length() > 2000) {
            throw new ClientException("留言内容过长");
        }

        String topic = StrUtil.blankToDefault(request.getTopic(), "general");
        String title = "deals".equalsIgnoreCase(topic) ? "SWT · 羊毛咨询" : "SWT · 站点留言";
        String contact = StrUtil.blankToDefault(request.getContact(), "(未留)");
        String pageUrl = StrUtil.blankToDefault(request.getPageUrl(), "(未知)");
        String at = StrUtil.blankToDefault(request.getAt(), Instant.now().toString());

        String content = String.join("\n",
                "【" + title + "】",
                "时间: " + at,
                "页面: " + pageUrl,
                "联系方式: " + contact,
                "────────",
                message
        );

        JSONObject text = JSONUtil.createObj().set("content", content);
        JSONObject body = JSONUtil.createObj()
                .set("msgtype", "text")
                .set("text", text);

        String response;
        try {
            response = HttpUtil.post(webhook, body.toString());
        } catch (Exception ex) {
            log.error("企业微信 webhook 请求失败", ex);
            throw new ClientException("企业微信通知发送失败，请稍后重试");
        }

        JSONObject result = JSONUtil.parseObj(response);
        int errcode = result.getInt("errcode", -1);
        if (errcode != 0) {
            log.warn("企业微信 webhook 返回 errcode={}, errmsg={}", errcode, result.getStr("errmsg"));
            throw new ClientException("企业微信通知被拒绝: " + result.getStr("errmsg", "unknown"));
        }
    }
}
