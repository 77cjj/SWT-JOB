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

package com.nageoffer.ai.ragent.user.service;

import cn.hutool.core.util.StrUtil;
import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.nageoffer.ai.ragent.framework.exception.ClientException;
import com.nageoffer.ai.ragent.user.config.GoogleOAuthProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleOAuthService {

    private final GoogleOAuthProperties googleOAuthProperties;

    public VerifiedGoogleUser verifyIdToken(String idToken) {
        if (StrUtil.isBlank(idToken)) {
            throw new ClientException("Google 登录凭证为空");
        }
        if (StrUtil.isBlank(googleOAuthProperties.getClientId())) {
            throw new ClientException("服务端未配置 GOOGLE_CLIENT_ID");
        }

        String body = fetchTokenInfo(idToken.trim());
        JSONObject json = JSONUtil.parseObj(body);
        if (json.containsKey("error_description") || json.containsKey("error")) {
            throw new ClientException("Google 登录无效或已过期");
        }

        String aud = json.getStr("aud");
        if (!googleOAuthProperties.getClientId().equals(aud)) {
            throw new ClientException("Google Client ID 不匹配");
        }

        String email = json.getStr("email");
        if (StrUtil.isBlank(email)) {
            throw new ClientException("Google 账号缺少邮箱信息");
        }

        String emailVerified = json.getStr("email_verified");
        if ("false".equalsIgnoreCase(emailVerified)) {
            throw new ClientException("请先在 Google 账号中验证邮箱");
        }

        return new VerifiedGoogleUser(
                json.getStr("sub"),
                email.trim().toLowerCase(),
                json.getStr("name"),
                json.getStr("picture")
        );
    }

    private String fetchTokenInfo(String idToken) {
        String encoded = URLEncoder.encode(idToken, StandardCharsets.UTF_8);
        Exception directError = null;
        try {
            return HttpUtil.get("https://oauth2.googleapis.com/tokeninfo?id_token=" + encoded, 10000);
        } catch (Exception ex) {
            directError = ex;
            log.warn("Google tokeninfo 直连失败，尝试代理: {}", ex.toString());
        }

        String proxy = StrUtil.trimToEmpty(googleOAuthProperties.getTokeninfoProxyUrl());
        if (StrUtil.isNotBlank(proxy)) {
            try {
                String sep = proxy.contains("?") ? "&" : "?";
                String url = proxy + sep + "id_token=" + encoded;
                return HttpRequest.get(url).timeout(12000).execute().body();
            } catch (Exception proxyEx) {
                log.error("Google tokeninfo 代理也失败", proxyEx);
                throw new ClientException("无法验证 Google 登录，请稍后重试（代理校验失败）");
            }
        }

        log.error("Google tokeninfo 不可达且未配置 GOOGLE_TOKENINFO_PROXY_URL", directError);
        throw new ClientException("无法验证 Google 登录，请稍后重试（服务器无法连接 Google，请配置 GOOGLE_TOKENINFO_PROXY_URL）");
    }

    public record VerifiedGoogleUser(String subject, String email, String name, String picture) {
    }
}
