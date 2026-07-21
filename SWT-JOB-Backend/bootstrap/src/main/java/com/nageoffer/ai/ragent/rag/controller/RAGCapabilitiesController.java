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
