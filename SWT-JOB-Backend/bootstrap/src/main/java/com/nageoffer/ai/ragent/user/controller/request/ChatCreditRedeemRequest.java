package com.nageoffer.ai.ragent.user.controller.request;

import lombok.Data;

@Data
public class ChatCreditRedeemRequest {
    private String userId;
    private Integer count;
}
