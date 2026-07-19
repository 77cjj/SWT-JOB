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

package com.nageoffer.ai.ragent.rag.service.impl;

import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;
import com.nageoffer.ai.ragent.framework.context.UserContext;
import com.nageoffer.ai.ragent.framework.trace.RagTraceContext;
import com.nageoffer.ai.ragent.framework.web.SseEmitterSender;
import com.nageoffer.ai.ragent.infra.chat.StreamCallback;
import com.nageoffer.ai.ragent.rag.aop.ChatRateLimit;
import com.nageoffer.ai.ragent.rag.dto.CompletionPayload;
import com.nageoffer.ai.ragent.rag.dto.MessageDelta;
import com.nageoffer.ai.ragent.rag.dto.MetaPayload;
import com.nageoffer.ai.ragent.rag.enums.SSEEventType;
import com.nageoffer.ai.ragent.rag.service.RAGChatService;
import com.nageoffer.ai.ragent.rag.service.handler.StreamCallbackFactory;
import com.nageoffer.ai.ragent.rag.service.handler.StreamTaskManager;
import com.nageoffer.ai.ragent.rag.service.pipeline.StreamChatContext;
import com.nageoffer.ai.ragent.rag.service.pipeline.StreamChatPipeline;
import com.nageoffer.ai.ragent.user.service.AiQuotaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * RAG 对话服务默认实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RAGChatServiceImpl implements RAGChatService {

    private static final String QUOTA_EXCEEDED_MESSAGE =
            "免费 AI 提问次数已用尽。请前往 /pricing 查看套餐，或联系站长开通更多次数。";

    private final StreamChatPipeline chatPipeline;
    private final StreamCallbackFactory callbackFactory;
    private final StreamTaskManager taskManager;
    private final AiQuotaService aiQuotaService;

    @Override
    @ChatRateLimit
    public void streamChat(String question, String conversationId, Boolean deepThinking, SseEmitter emitter) {
        String actualConversationId = StrUtil.isBlank(conversationId) ? IdUtil.getSnowflakeNextIdStr() : conversationId;
        String taskId = StrUtil.isBlank(RagTraceContext.getTaskId())
                ? IdUtil.getSnowflakeNextIdStr()
                : RagTraceContext.getTaskId();
        String userId = UserContext.getUserId();

        if (!aiQuotaService.tryConsume(userId)) {
            log.info("AI 配额不足，拒绝对话，userId={}，会话ID：{}", userId, actualConversationId);
            sendQuotaReject(emitter, actualConversationId, taskId);
            return;
        }

        log.info("开始流式对话，会话ID：{}，任务ID：{}", actualConversationId, taskId);
        boolean thinkingEnabled = Boolean.TRUE.equals(deepThinking);

        StreamCallback callback = callbackFactory.createChatEventHandler(emitter, actualConversationId, taskId);

        StreamChatContext ctx = StreamChatContext.builder()
                .question(question)
                .conversationId(actualConversationId)
                .taskId(taskId)
                .deepThinking(thinkingEnabled)
                .userId(userId)
                .callback(callback)
                .build();

        try {
            chatPipeline.execute(ctx);
        } catch (Exception e) {
            log.error("流式对话处理异常，会话ID：{}，任务ID：{}", actualConversationId, taskId, e);
            callback.onError(e);
        }
    }

    @Override
    public void stopTask(String taskId) {
        taskManager.cancel(taskId);
    }

    private void sendQuotaReject(SseEmitter emitter, String conversationId, String taskId) {
        SseEmitterSender sender = new SseEmitterSender(emitter);
        sender.sendEvent(SSEEventType.META.value(), new MetaPayload(conversationId, taskId));
        sender.sendEvent(SSEEventType.REJECT.value(), new MessageDelta("response", QUOTA_EXCEEDED_MESSAGE));
        sender.sendEvent(SSEEventType.FINISH.value(), new CompletionPayload(null, null));
        sender.sendEvent(SSEEventType.DONE.value(), "[DONE]");
        sender.complete();
    }
}
