package com.nageoffer.ai.ragent.user.service;

import cn.hutool.core.util.StrUtil;
import cn.hutool.http.HttpUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.nageoffer.ai.ragent.framework.exception.ClientException;
import com.nageoffer.ai.ragent.user.config.WeChatOAuthProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class WeChatOAuthService {

    private final WeChatOAuthProperties weChatOAuthProperties;

    public VerifiedWeChatUser exchangeCode(String code) {
        if (StrUtil.isBlank(code)) {
            throw new ClientException("微信登录 code 为空");
        }
        String appId = StrUtil.trimToEmpty(weChatOAuthProperties.getAppId());
        String secret = StrUtil.trimToEmpty(weChatOAuthProperties.getAppSecret());
        if (StrUtil.isBlank(appId) || StrUtil.isBlank(secret)) {
            throw new ClientException("服务端未配置 WECHAT_APP_ID / WECHAT_APP_SECRET");
        }

        String url = String.format(
                "https://api.weixin.qq.com/sns/oauth2/access_token?appid=%s&secret=%s&code=%s&grant_type=authorization_code",
                appId,
                secret,
                code.trim());

        String body;
        try {
            body = HttpUtil.get(url, 10000);
        } catch (Exception ex) {
            log.error("WeChat token exchange failed", ex);
            throw new ClientException("无法连接微信服务器，请稍后重试");
        }

        JSONObject json = JSONUtil.parseObj(body);
        if (json.containsKey("errcode") && json.getInt("errcode", 0) != 0) {
            throw new ClientException("微信登录失败: " + json.getStr("errmsg", "invalid code"));
        }

        String openId = json.getStr("openid");
        if (StrUtil.isBlank(openId)) {
            throw new ClientException("微信登录未返回 openid");
        }

        String unionId = json.getStr("unionid");
        String nickname = null;
        String avatar = null;

        String accessToken = json.getStr("access_token");
        if (StrUtil.isNotBlank(accessToken)) {
            try {
                String userInfoUrl = String.format(
                        "https://api.weixin.qq.com/sns/userinfo?access_token=%s&openid=%s",
                        accessToken,
                        openId);
                JSONObject profile = JSONUtil.parseObj(HttpUtil.get(userInfoUrl, 8000));
                if (!profile.containsKey("errcode")) {
                    nickname = profile.getStr("nickname");
                    avatar = profile.getStr("headimgurl");
                }
            } catch (Exception ex) {
                log.debug("WeChat userinfo optional fetch failed: {}", ex.toString());
            }
        }

        return new VerifiedWeChatUser(openId, unionId, nickname, avatar);
    }

    public record VerifiedWeChatUser(String openId, String unionId, String nickname, String avatar) {
    }
}
