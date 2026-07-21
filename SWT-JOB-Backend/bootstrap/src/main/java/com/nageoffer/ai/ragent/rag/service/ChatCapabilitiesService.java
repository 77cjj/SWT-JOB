package com.nageoffer.ai.ragent.rag.service;

import cn.hutool.core.util.StrUtil;
import com.nageoffer.ai.ragent.infra.config.AIModelProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChatCapabilitiesService {

    private final AIModelProperties aiModelProperties;

    public boolean isDeepThinkingAvailable() {
        AIModelProperties.ModelGroup chat = aiModelProperties.getChat();
        if (chat == null || StrUtil.isBlank(chat.getDeepThinkingModel())) {
            return false;
        }
        if (chat.getCandidates() == null || chat.getCandidates().isEmpty()) {
            return false;
        }
        return chat.getCandidates().stream()
                .anyMatch(c -> c != null
                        && !Boolean.FALSE.equals(c.getEnabled())
                        && Boolean.TRUE.equals(c.getSupportsThinking()));
    }
}
