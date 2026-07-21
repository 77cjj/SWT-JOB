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

package com.nageoffer.ai.ragent.siteinquiry.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "app.site-inquiry")
public class SiteInquiryProperties {

    /**
     * 企业微信群机器人 Webhook 完整 URL（含 key，仅放环境变量，勿提交仓库）
     */
    private String weworkWebhookUrl = "";

    /**
     * Vercel 转发时携带 X-Site-Inquiry-Secret，与此一致才受理（可选但建议配置）
     */
    private String webhookSecret = "";
}
