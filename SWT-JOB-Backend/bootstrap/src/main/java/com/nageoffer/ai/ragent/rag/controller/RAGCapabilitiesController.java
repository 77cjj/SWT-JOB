package com.nageoffer.ai.ragent.rag.controller;

import com.nageoffer.ai.ragent.framework.convention.Result;
import com.nageoffer.ai.ragent.framework.web.Results;
import com.nageoffer.ai.ragent.rag.controller.vo.ChatCapabilitiesVO;
import com.nageoffer.ai.ragent.rag.service.ChatCapabilitiesService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 聊天能力探测（无需登录，供前台决定是否展示深度思考等开关）
 */
@RestController
@RequiredArgsConstructor
public class RAGCapabilitiesController {

    private final ChatCapabilitiesService chatCapabilitiesService;

    @GetMapping("/rag/capabilities")
    public Result<ChatCapabilitiesVO> capabilities() {
        return Results.success(
                ChatCapabilitiesVO.builder()
                        .deepThinking(chatCapabilitiesService.isDeepThinkingAvailable())
                        .build()
        );
    }
}
