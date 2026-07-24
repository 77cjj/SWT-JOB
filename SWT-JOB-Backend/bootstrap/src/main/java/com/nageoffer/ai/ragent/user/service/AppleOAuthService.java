package com.nageoffer.ai.ragent.user.service;

import cn.hutool.core.util.StrUtil;
import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.nageoffer.ai.ragent.framework.exception.ClientException;
import com.nageoffer.ai.ragent.user.config.AppleOAuthProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppleOAuthService {

    private final AppleOAuthProperties appleOAuthProperties;

    public VerifiedAppleUser verifyIdToken(String idToken) {
        if (StrUtil.isBlank(idToken)) {
            throw new ClientException("Apple 登录凭证为空");
        }
        if (StrUtil.isBlank(appleOAuthProperties.getClientId())) {
            throw new ClientException("服务端未配置 APPLE_CLIENT_ID");
        }

        JSONObject json = fetchClaims(idToken.trim());
        String sub = json.getStr("sub");
        if (StrUtil.isBlank(sub)) {
            throw new ClientException("Apple 登录缺少用户标识");
        }

        String aud = json.getStr("aud");
        if (!appleOAuthProperties.getClientId().equals(aud)) {
            throw new ClientException("Apple Client ID 不匹配");
        }

        String email = json.getStr("email");
        Object emailVerified = json.get("email_verified");
        if (StrUtil.isNotBlank(email) && Boolean.FALSE.equals(emailVerified)
                || "false".equalsIgnoreCase(String.valueOf(emailVerified))) {
            throw new ClientException("请先在 Apple ID 中验证邮箱");
        }

        return new VerifiedAppleUser(sub, StrUtil.blankToDefault(email, "").trim().toLowerCase());
    }

    private JSONObject fetchClaims(String idToken) {
        String proxy = StrUtil.trimToEmpty(appleOAuthProperties.getVerifyProxyUrl());
        if (StrUtil.isNotBlank(proxy)) {
            try {
                String encoded = URLEncoder.encode(idToken, StandardCharsets.UTF_8);
                String sep = proxy.contains("?") ? "&" : "?";
                String body = HttpRequest.post(proxy)
                        .body("{\"idToken\":\"" + idToken.replace("\"", "\\\"") + "\"}")
                        .header("Content-Type", "application/json")
                        .timeout(12000)
                        .execute()
                        .body();
                JSONObject result = JSONUtil.parseObj(body);
                if (result.getBool("ok", false) || result.containsKey("sub")) {
                    return result;
                }
                String getBody = HttpUtil.get(proxy + sep + "id_token=" + encoded, 12000);
                JSONObject getResult = JSONUtil.parseObj(getBody);
                if (getResult.containsKey("sub")) {
                    return getResult;
                }
            } catch (Exception ex) {
                log.warn("Apple verify proxy failed: {}", ex.toString());
            }
        }

        throw new ClientException("无法验证 Apple 登录，请配置 APPLE_VERIFY_PROXY_URL（Vercel /api/auth/apple-verify）");
    }

    public record VerifiedAppleUser(String subject, String email) {
    }
}
