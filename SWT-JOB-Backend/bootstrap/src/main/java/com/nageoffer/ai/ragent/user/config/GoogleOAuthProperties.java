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

package com.nageoffer.ai.ragent.user.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "google.oauth")
public class GoogleOAuthProperties {

    /**
     * Google Cloud OAuth Web Client ID（与前端 NEXT_PUBLIC_GOOGLE_CLIENT_ID 一致）
     */
    private String clientId = "";

    /**
     * 可选：当 ECS 无法直连 Google 时，经 Vercel 代理校验 id_token。
     * 例：https://swtjob.vercel.app/api/auth/google-tokeninfo
     */
    private String tokeninfoProxyUrl = "";

    /**
     * 可选：Vercel Deployment Protection Bypass 密钥。
     * 代理 URL 若被保护，需在请求头带 x-vercel-protection-bypass。
     */
    private String tokeninfoProxyBypass = "";

    /** 是否开放 Google 登录，默认开启 */
    private boolean enabled = true;

    /**
     * Vercel 已校验 id_token 后，用此密钥做 HMAC，ECS 无需再访问 Google。
     * 未配置时回退 client secret / bypass。
     */
    private String trustHmacSecret = "";
}
