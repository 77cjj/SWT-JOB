package com.nageoffer.ai.ragent.user.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "apple.oauth")
public class AppleOAuthProperties {

    /** Apple Services ID（与前端 NEXT_PUBLIC_APPLE_CLIENT_ID 一致） */
    private String clientId = "";

    /**
     * 可选：ECS 无法直连 Apple JWKS 时，经 Vercel 校验 id_token。
     * 例：https://swtjob.vercel.app/api/auth/apple-verify
     */
    private String verifyProxyUrl = "";
}
