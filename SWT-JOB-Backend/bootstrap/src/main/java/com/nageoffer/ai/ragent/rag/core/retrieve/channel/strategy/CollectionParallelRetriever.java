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

package com.nageoffer.ai.ragent.rag.core.retrieve.channel.strategy;

import com.nageoffer.ai.ragent.framework.convention.RetrievedChunk;
import com.nageoffer.ai.ragent.rag.core.retrieve.RetrieveRequest;
import com.nageoffer.ai.ragent.rag.core.retrieve.RetrieverService;
import com.nageoffer.ai.ragent.rag.core.retrieve.channel.AbstractParallelRetriever;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

/**
 * Collection 并行检索器
 * <p>
 * 按 embedding 模型分组后复用 Query Embedding，避免同一问题对每个库重复向量化
 */
@Slf4j
public class CollectionParallelRetriever extends AbstractParallelRetriever<RetrieveRequest> {

    private final RetrieverService retrieverService;
    private final Executor executor;

    public CollectionParallelRetriever(RetrieverService retrieverService, Executor executor) {
        super(executor);
        this.retrieverService = retrieverService;
        this.executor = executor;
    }

    @Override
    public List<RetrievedChunk> executeParallelRetrieval(String question,
                                                         List<RetrieveRequest> targets,
                                                         int topK) {
        if (targets == null || targets.isEmpty()) {
            return List.of();
        }

        Map<String, List<RetrieveRequest>> byModel = new LinkedHashMap<>();
        for (RetrieveRequest target : targets) {
            String modelKey = StringUtils.hasText(target.getEmbeddingModel())
                    ? target.getEmbeddingModel().trim()
                    : "";
            byModel.computeIfAbsent(modelKey, ignored -> new ArrayList<>()).add(target);
        }

        List<RetrievedChunk> allChunks = new ArrayList<>();
        int successCount = 0;
        int failureCount = 0;

        for (Map.Entry<String, List<RetrieveRequest>> entry : byModel.entrySet()) {
            String modelKey = entry.getKey();
            float[] queryVector = retrieverService.embedAndNormalize(
                    question,
                    StringUtils.hasText(modelKey) ? modelKey : null
            );

            List<CompletableFuture<List<RetrievedChunk>>> futures = entry.getValue().stream()
                    .map(target -> CompletableFuture.supplyAsync(() -> {
                        try {
                            return retrieverService.retrieveByVector(
                                    queryVector,
                                    RetrieveRequest.builder()
                                            .collectionName(target.getCollectionName())
                                            .embeddingModel(target.getEmbeddingModel())
                                            .query(question)
                                            .topK(topK)
                                            .build()
                            );
                        } catch (Exception e) {
                            log.error("在 collection {} 中检索失败，错误: {}",
                                    target.getCollectionName(), e.getMessage(), e);
                            return List.<RetrievedChunk>of();
                        }
                    }, executor))
                    .toList();

            for (CompletableFuture<List<RetrievedChunk>> future : futures) {
                try {
                    allChunks.addAll(future.join());
                    successCount++;
                } catch (Exception e) {
                    failureCount++;
                    log.error("全局检索 获取检索结果失败", e);
                }
            }
        }

        allChunks.sort((a, b) -> Float.compare(
                b.getScore() == null ? Float.NEGATIVE_INFINITY : b.getScore(),
                a.getScore() == null ? Float.NEGATIVE_INFINITY : a.getScore()
        ));

        log.info("全局检索 检索统计 - 总目标数: {}, 成功: {}, 失败: {}, 检索到 Chunk 总数: {}",
                targets.size(), successCount, failureCount, allChunks.size());
        return allChunks;
    }

    @Override
    protected List<RetrievedChunk> createRetrievalTask(String question, RetrieveRequest targetTemplate, int topK) {
        try {
            return retrieverService.retrieve(
                    RetrieveRequest.builder()
                            .collectionName(targetTemplate.getCollectionName())
                            .embeddingModel(targetTemplate.getEmbeddingModel())
                            .query(question)
                            .topK(topK)
                            .build()
            );
        } catch (Exception e) {
            log.error("在 collection {} 中检索失败，错误: {}", targetTemplate.getCollectionName(), e.getMessage(), e);
            return List.of();
        }
    }

    @Override
    protected String getTargetIdentifier(RetrieveRequest targetTemplate) {
        return "Collection: " + targetTemplate.getCollectionName();
    }

    @Override
    protected String getStatisticsName() {
        return "全局检索";
    }
}
