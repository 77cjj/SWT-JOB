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
import cn.hutool.http.HttpResponse;
import cn.hutool.http.HttpUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.nageoffer.ai.ragent.framework.exception.ClientException;
import com.nageoffer.ai.ragent.user.config.GoogleOAuthProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleOAuthService {

    private final GoogleOAuthProperties googleOAuthProperties;

    public VerifiedGoogleUser verifyIdToken(String idToken) {
        return verifyIdToken(idToken, null);
    }

    public VerifiedGoogleUser verifyIdToken(String idToken, String vercelHmac) {
        if (StrUtil.isBlank(idToken)) {
            throw new ClientException("Google 登录凭证为空");
        }
        if (StrUtil.isBlank(googleOAuthProperties.getClientId())) {
            throw new ClientException("服务端未配置 GOOGLE_CLIENT_ID");
        }

        if (hmacMatches(idToken.trim(), vercelHmac)) {
            return parseVerifiedPayload(idToken.trim());
        }
        if (StrUtil.isNotBlank(vercelHmac)) {
            log.warn("Google 登录收到 Vercel 签名，但与 ECS 共享密钥不匹配");
            throw new ClientException(
                    "Google 登录服务配置不一致：请确保 Vercel 与 ECS 的 "
                            + "GOOGLE_OAUTH_TRUST_SECRET 完全相同，并分别 Redeploy/重启"
            );
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

    private boolean hmacMatches(String idToken, String providedHmac) {
        String secret = googleOAuthProperties.getTrustHmacSecret();
        if (StrUtil.isBlank(secret) || StrUtil.isBlank(providedHmac)) {
            return false;
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            String expected = bytesToHex(mac.doFinal(idToken.getBytes(StandardCharsets.UTF_8)));
            return MessageDigest.isEqual(
                    expected.getBytes(StandardCharsets.UTF_8),
                    providedHmac.trim().toLowerCase().getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            log.warn("Google HMAC 校验失败: {}", e.toString());
            return false;
        }
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private VerifiedGoogleUser parseVerifiedPayload(String idToken) {
        String[] parts = idToken.split("\\.");
        if (parts.length < 2) {
            throw new ClientException("Google 登录凭证格式无效");
        }
        try {
            String json = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            JSONObject payload = JSONUtil.parseObj(json);
            String aud = payload.getStr("aud");
            if (!googleOAuthProperties.getClientId().equals(aud)) {
                throw new ClientException("Google Client ID 不匹配");
            }
            Long exp = payload.getLong("exp");
            if (exp != null && exp * 1000L < System.currentTimeMillis()) {
                throw new ClientException("Google 登录无效或已过期");
            }
            String email = payload.getStr("email");
            if (StrUtil.isBlank(email)) {
                throw new ClientException("Google 账号缺少邮箱信息");
            }
            if ("false".equalsIgnoreCase(payload.getStr("email_verified"))) {
                throw new ClientException("请先在 Google 账号中验证邮箱");
            }
            return new VerifiedGoogleUser(
                    payload.getStr("sub"),
                    email.trim().toLowerCase(),
                    payload.getStr("name"),
                    payload.getStr("picture")
            );
        } catch (ClientException e) {
            throw e;
        } catch (Exception e) {
            throw new ClientException("Google 登录凭证无法解析");
        }
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
                return fetchTokenInfoViaProxy(proxy, idToken);
            } catch (ClientException proxyEx) {
                throw proxyEx;
            } catch (Exception proxyEx) {
                log.error("Google tokeninfo 代理也失败 proxy={} directErr={}",
                        proxy, directError == null ? "n/a" : directError.toString(), proxyEx);
                throw new ClientException(
                        "无法验证 Google 登录（代理校验失败）。请确认：1) ECS 能访问 "
                                + proxy
                                + " 2) 若 Vercel 开了 Deployment Protection，请配置 GOOGLE_TOKENINFO_PROXY_BYPASS "
                                + "3) .env 中 GOOGLE_TOKENINFO_PROXY_URL 正确后重启后端"
                );
            }
        }

        log.error("Google tokeninfo 不可达且未配置 GOOGLE_TOKENINFO_PROXY_URL", directError);
        throw new ClientException("无法验证 Google 登录，请稍后重试（服务器无法连接 Google，请配置 GOOGLE_TOKENINFO_PROXY_URL）");
    }

    private String fetchTokenInfoViaProxy(String proxy, String idToken) {
        Exception postError = null;
        try {
            return fetchTokenInfoViaProxyPost(proxy, idToken);
        } catch (ClientException e) {
            throw e;
        } catch (Exception e) {
            postError = e;
            log.warn("Google tokeninfo 代理 POST 失败，尝试 GET: {}", e.toString());
        }
        try {
            return fetchTokenInfoViaProxyGet(proxy, idToken);
        } catch (ClientException e) {
            throw e;
        } catch (Exception getError) {
            if (postError != null) {
                log.warn("Google tokeninfo 代理 GET 也失败: {}", getError.toString());
            }
            throw getError instanceof RuntimeException re
                    ? re
                    : new IllegalStateException(getError);
        }
    }

    private String fetchTokenInfoViaProxyPost(String proxy, String idToken) {
        String payload = JSONUtil.createObj().set("id_token", idToken).toString();
        HttpRequest request = HttpRequest.post(proxy)
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .body(payload)
                .timeout(15000);
        applyProxyBypass(request);
        try (HttpResponse response = request.execute()) {
            return parseProxyResponse(response);
        }
    }

    private String fetchTokenInfoViaProxyGet(String proxy, String idToken) {
        String separator = proxy.contains("?") ? "&" : "?";
        String url = proxy + separator + "id_token=" + URLEncoder.encode(idToken, StandardCharsets.UTF_8);
        HttpRequest request = HttpRequest.get(url)
                .header("Accept", "application/json")
                .timeout(15000);
        applyProxyBypass(request);
        try (HttpResponse response = request.execute()) {
            return parseProxyResponse(response);
        }
    }

    private void applyProxyBypass(HttpRequest request) {
        String bypass = StrUtil.trimToEmpty(googleOAuthProperties.getTokeninfoProxyBypass());
        if (StrUtil.isNotBlank(bypass)) {
            request.header("x-vercel-protection-bypass", bypass);
        }
    }

    private String parseProxyResponse(HttpResponse response) {
        int status = response.getStatus();
        String body = StrUtil.nullToEmpty(response.body());
        if (status == 401 || status == 403) {
            throw new ClientException(
                    "Google 代理被拦截（HTTP " + status + "）。若 Vercel 开启了 Deployment Protection，"
                            + "请在 Settings → Deployment Protection 创建 Protection Bypass for Automation，"
                            + "并把密钥写入后端 .env：GOOGLE_TOKENINFO_PROXY_BYPASS=... 然后重启"
            );
        }
        if (status >= 500) {
            throw new IllegalStateException("proxy HTTP " + status + ": " + StrUtil.maxLength(body, 200));
        }
        if (status < 200 || status >= 300) {
            throw new IllegalStateException("proxy HTTP " + status + ": " + StrUtil.maxLength(body, 200));
        }
        if (StrUtil.isBlank(body)) {
            throw new IllegalStateException("proxy empty body, HTTP " + status);
        }
        JSONObject json = JSONUtil.parseObj(body);
        if (json.containsKey("error") || json.containsKey("error_description")) {
            throw new IllegalStateException("proxy error: " + StrUtil.maxLength(body, 200));
        }
        if (StrUtil.isBlank(json.getStr("aud"))
                || StrUtil.isBlank(json.getStr("sub"))
                || StrUtil.isBlank(json.getStr("email"))) {
            throw new IllegalStateException("proxy unexpected payload: " + StrUtil.maxLength(body, 200));
        }
        return body;
    }

    public record VerifiedGoogleUser(String subject, String email, String name, String picture) {
    }
}
