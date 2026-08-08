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
import com.nageoffer.ai.ragent.knowledge.dao.entity.KnowledgeBaseDO;
import com.nageoffer.ai.ragent.knowledge.dao.mapper.KnowledgeBaseMapper;
import com.nageoffer.ai.ragent.rag.core.intent.IntentNode;
import com.nageoffer.ai.ragent.rag.core.intent.NodeScore;
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
 * 意图并行检索器
 * <p>
 * 按知识库 embedding 模型分组后复用 Query Embedding
 */
@Slf4j
public class IntentParallelRetriever extends AbstractParallelRetriever<IntentParallelRetriever.IntentTask> {

    private final RetrieverService retrieverService;
    private final KnowledgeBaseMapper knowledgeBaseMapper;
    private final Executor executor;

    public record IntentTask(NodeScore nodeScore, int intentTopK, String embeddingModel) {
    }

    public IntentParallelRetriever(RetrieverService retrieverService,
                                   KnowledgeBaseMapper knowledgeBaseMapper,
                                   Executor executor) {
        super(executor);
        this.retrieverService = retrieverService;
        this.knowledgeBaseMapper = knowledgeBaseMapper;
        this.executor = executor;
    }

    /**
     * 执行并行检索（重载方法，支持动态 TopK 计算）
     */
    public List<RetrievedChunk> executeParallelRetrieval(String question,
                                                         List<NodeScore> targets,
                                                         int fallbackTopK,
                                                         int topKMultiplier) {
        List<IntentTask> intentTasks = targets.stream()
                .map(nodeScore -> {
                    IntentNode node = nodeScore.getNode();
                    return new IntentTask(
                            nodeScore,
                            resolveIntentTopK(nodeScore, fallbackTopK, topKMultiplier),
                            resolveKbEmbeddingModel(node == null ? null : node.getKbId())
                    );
                })
                .toList();
        return executeParallelRetrieval(question, intentTasks, fallbackTopK);
    }

    @Override
    public List<RetrievedChunk> executeParallelRetrieval(String question,
                                                         List<IntentTask> targets,
                                                         int topK) {
        if (targets == null || targets.isEmpty()) {
            return List.of();
        }

        Map<String, List<IntentTask>> byModel = new LinkedHashMap<>();
        for (IntentTask task : targets) {
            String modelKey = StringUtils.hasText(task.embeddingModel())
                    ? task.embeddingModel().trim()
                    : "";
            byModel.computeIfAbsent(modelKey, ignored -> new ArrayList<>()).add(task);
        }

        List<RetrievedChunk> allChunks = new ArrayList<>();
        int successCount = 0;
        int failureCount = 0;

        for (Map.Entry<String, List<IntentTask>> entry : byModel.entrySet()) {
            String modelKey = entry.getKey();
            float[] queryVector = retrieverService.embedAndNormalize(
                    question,
                    StringUtils.hasText(modelKey) ? modelKey : null
            );

            List<CompletableFuture<List<RetrievedChunk>>> futures = entry.getValue().stream()
                    .map(task -> CompletableFuture.supplyAsync(
                            () -> retrieveWithVector(question, task, queryVector),
                            executor
                    ))
                    .toList();

            for (int i = 0; i < futures.size(); i++) {
                IntentTask task = entry.getValue().get(i);
                try {
                    allChunks.addAll(futures.get(i).join());
                    successCount++;
                } catch (Exception e) {
                    failureCount++;
                    log.error("意图检索 获取检索结果失败 - 目标: {}", getTargetIdentifier(task), e);
                }
            }
        }

        allChunks.sort((a, b) -> Float.compare(
                b.getScore() == null ? Float.NEGATIVE_INFINITY : b.getScore(),
                a.getScore() == null ? Float.NEGATIVE_INFINITY : a.getScore()
        ));

        log.info("意图检索 检索统计 - 总目标数: {}, 成功: {}, 失败: {}, 检索到 Chunk 总数: {}",
                targets.size(), successCount, failureCount, allChunks.size());
        return allChunks;
    }

    private List<RetrievedChunk> retrieveWithVector(String question, IntentTask task, float[] queryVector) {
        NodeScore nodeScore = task.nodeScore();
        IntentNode node = nodeScore.getNode();
        try {
            String collection = node.getCollectionName() == null ? null : node.getCollectionName().trim();
            return retrieverService.retrieveByVector(
                    queryVector,
                    RetrieveRequest.builder()
                            .collectionName(collection)
                            .embeddingModel(task.embeddingModel())
                            .query(question)
                            .topK(Math.max(1, task.intentTopK()))
                            .build()
            );
        } catch (Exception e) {
            log.error("意图检索失败 - 意图ID: {}, 意图名称: {}, Collection: {}, 错误: {}",
                    node.getId(), node.getName(), node.getCollectionName(), e.getMessage(), e);
            return List.of();
        }
    }

    @Override
    protected List<RetrievedChunk> createRetrievalTask(String question, IntentTask task, int ignoredTopK) {
        return retrieveWithVector(
                question,
                task,
                retrieverService.embedAndNormalize(question, task.embeddingModel())
        );
    }

    @Override
    protected String getTargetIdentifier(IntentTask task) {
        NodeScore nodeScore = task.nodeScore();
        IntentNode node = nodeScore.getNode();
        return String.format("意图ID: %s, 意图名称: %s", node.getId(), node.getName());
    }

    @Override
    protected String getStatisticsName() {
        return "意图检索";
    }

    private int resolveIntentTopK(NodeScore nodeScore, int fallbackTopK, int topKMultiplier) {
        int baseTopK = fallbackTopK;
        if (nodeScore != null && nodeScore.getNode() != null) {
            Integer nodeTopK = nodeScore.getNode().getTopK();
            if (nodeTopK != null && nodeTopK > 0) {
                baseTopK = nodeTopK;
            }
        }

        if (topKMultiplier <= 0) {
            log.warn("意图定向通道倍率配置异常: {}, 使用基础 TopK: {}", topKMultiplier, baseTopK);
            return Math.max(1, baseTopK);
        }

        return Math.max(1, baseTopK * topKMultiplier);
    }

    private String resolveKbEmbeddingModel(String kbId) {
        if (!StringUtils.hasText(kbId)) {
            return null;
        }
        KnowledgeBaseDO kb = knowledgeBaseMapper.selectById(kbId);
        return kb != null ? kb.getEmbeddingModel() : null;
    }
}
