package com.nageoffer.ai.ragent.user.controller.request;

import lombok.Data;

@Data
public class WeChatLoginRequest {

    /** 微信 OAuth 回调 code */
    private String code;
}
