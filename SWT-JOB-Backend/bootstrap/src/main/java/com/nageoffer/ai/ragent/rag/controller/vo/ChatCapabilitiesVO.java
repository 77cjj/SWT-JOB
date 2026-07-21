package com.nageoffer.ai.ragent.rag.controller.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatCapabilitiesVO {

    /** 是否配置了深度思考模型且存在 supports-thinking 候选 */
    private boolean deepThinking;
}
