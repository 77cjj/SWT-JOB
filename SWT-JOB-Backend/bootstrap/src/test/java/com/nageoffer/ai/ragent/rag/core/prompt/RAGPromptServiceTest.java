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

package com.nageoffer.ai.ragent.rag.core.prompt;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.DefaultResourceLoader;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RAGPromptServiceTest {

    @Test
    void kbPromptAllowsStableGeneralKnowledgeButKeepsCurrentSwtFactsGrounded() {
        PromptTemplateLoader loader = new PromptTemplateLoader(new DefaultResourceLoader());
        RAGPromptService service = new RAGPromptService(loader);
        PromptContext context = PromptContext.builder()
                .question("美国一共有多少州，你会推荐我去哪个州")
                .kbContext("【相关文档】旅行偏好参考")
                .kbIntents(List.of())
                .intentChunks(Map.of())
                .build();

        String prompt = service.buildSystemPrompt(context, "zh");

        assertTrue(prompt.contains("稳定、低风险且广为人知的通用事实"));
        assertTrue(prompt.contains("SWT 项目的实时政策"));
        assertFalse(prompt.contains("对话中标注为【文档内容】的文字是唯一信息源"));
    }
}
