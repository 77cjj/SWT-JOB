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
import com.nageoffer.ai.ragent.infra.embedding.EmbeddingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Embedding 测试接口
 */
@Slf4j
@RestController
@RequiredArgsConstructor
public class EmbeddingTestController {

    private final EmbeddingService embeddingService;

    /**
     * 测试单个文本 embedding
     */
    @PostMapping("/rag/embedding")
    public Result<EmbeddingResponse> embed(@RequestBody EmbeddingRequest request) {
        try {
            List<Float> vector = embeddingService.embed(request.getText(), request.getModel());
            return new Result<EmbeddingResponse>()
                    .setCode(Result.SUCCESS_CODE)
                    .setData(new EmbeddingResponse(vector.size(), vector));
        } catch (Exception e) {
            log.error("Embedding 测试失败: {}", e.getMessage(), e);
            return new Result<EmbeddingResponse>()
                    .setCode("B000001")
                    .setMessage("Embedding 测试失败: " + e.getMessage());
        }
    }

    /**
     * 测试批量文本 embedding
     */
    @PostMapping("/rag/embedding/batch")
    public Result<List<EmbeddingResponse>> embedBatch(@RequestBody BatchEmbeddingRequest request) {
        try {
            List<List<Float>> vectors = embeddingService.embedBatch(request.getTexts(), request.getModel());
            List<EmbeddingResponse> responses = vectors.stream()
                    .map(v -> new EmbeddingResponse(v.size(), v))
                    .toList();
            return new Result<List<EmbeddingResponse>>()
                    .setCode(Result.SUCCESS_CODE)
                    .setData(responses);
        } catch (Exception e) {
            log.error("批量 Embedding 测试失败: {}", e.getMessage(), e);
            return new Result<List<EmbeddingResponse>>()
                    .setCode("B000001")
                    .setMessage("批量 Embedding 测试失败: " + e.getMessage());
        }
    }

    @lombok.Data
    public static class EmbeddingRequest {
        private String text;
        private String model;
    }

    @lombok.Data
    public static class BatchEmbeddingRequest {
        private List<String> texts;
        private String model;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class EmbeddingResponse {
        private int dimension;
        private List<Float> vector;
    }
}
