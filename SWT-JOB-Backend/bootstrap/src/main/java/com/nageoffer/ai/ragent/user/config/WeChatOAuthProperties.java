package com.nageoffer.ai.ragent.user.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "wechat.oauth")
public class WeChatOAuthProperties {

    /** 微信开放平台网站应用 AppID */
    private String appId = "";

    /** 微信开放平台 AppSecret（仅服务端） */
    private String appSecret = "";
}
