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

package com.nageoffer.ai.ragent.rag.core.retrieve.channel;

import cn.hutool.core.collection.CollUtil;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.nageoffer.ai.ragent.framework.convention.RetrievedChunk;
import com.nageoffer.ai.ragent.knowledge.dao.entity.KnowledgeBaseDO;
import com.nageoffer.ai.ragent.knowledge.dao.mapper.KnowledgeBaseMapper;
import com.nageoffer.ai.ragent.rag.config.SearchChannelProperties;
import com.nageoffer.ai.ragent.rag.core.intent.NodeScore;
import com.nageoffer.ai.ragent.rag.core.retrieve.RetrieveRequest;
import com.nageoffer.ai.ragent.rag.core.retrieve.RetrieverService;
import com.nageoffer.ai.ragent.rag.core.retrieve.channel.strategy.CollectionParallelRetriever;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executor;

/**
 * 向量全局检索通道
 * <p>
 * 在所有知识库中进行向量检索，作为兜底策略
 * 当意图识别失败或置信度低时启用
 */
@Slf4j
@Component
public class VectorGlobalSearchChannel implements SearchChannel {

    private final SearchChannelProperties properties;
    private final KnowledgeBaseMapper knowledgeBaseMapper;
    private final CollectionParallelRetriever parallelRetriever;

    public VectorGlobalSearchChannel(RetrieverService retrieverService,
                                     SearchChannelProperties properties,
                                     KnowledgeBaseMapper knowledgeBaseMapper,
                                     @Qualifier("ragInnerRetrievalThreadPoolExecutor") Executor innerRetrievalExecutor) {
        this.properties = properties;
        this.knowledgeBaseMapper = knowledgeBaseMapper;
        this.parallelRetriever = new CollectionParallelRetriever(retrieverService, innerRetrievalExecutor);
    }

    @Override
    public String getName() {
        return "VectorGlobalSearch";
    }

    @Override
    public int getPriority() {
        return 10;  // 较低优先级
    }

    @Override
    public boolean isEnabled(SearchContext context) {
        // 检查配置是否启用
        if (!properties.getChannels().getVectorGlobal().isEnabled()) {
            return false;
        }

        // 条件1：没有识别出任何意图
        List<NodeScore> allScores = context.getIntents().stream()
                .flatMap(si -> si.nodeScores().stream())
                .toList();
        if (CollUtil.isEmpty(allScores)) {
            log.info("未识别出任何意图，启用全局检索");
            return true;
        }

        // 条件2：意图置信度都很低
        double maxScore = allScores.stream()
                .mapToDouble(NodeScore::getScore)
                .max()
                .orElse(0.0);

        double threshold = properties.getChannels().getVectorGlobal().getConfidenceThreshold();
        if (maxScore < threshold) {
            log.info("意图置信度过低（{}），启用全局检索", maxScore);
            return true;
        }

        return false;
    }

    @Override
    public SearchChannelResult search(SearchContext context) {
        long startTime = System.currentTimeMillis();

        try {
            log.info("执行向量全局检索，问题：{}", context.getMainQuestion());

            // 获取所有 KB：collection + 写入向量时使用的 embedding 模型（查询向量需与同库一致）
            List<RetrieveRequest> targets = buildGlobalKbRetrieveTargets();

            if (targets.isEmpty()) {
                log.warn("未找到任何 KB collection，跳过全局检索");
                return SearchChannelResult.builder()
                        .channelType(SearchChannelType.VECTOR_GLOBAL)
                        .channelName(getName())
                        .chunks(List.of())
                        .confidence(0.0)
                        .latencyMs(System.currentTimeMillis() - startTime)
                        .build();
            }

            // 并行在所有 collection 中检索
            int topKMultiplier = properties.getChannels().getVectorGlobal().getTopKMultiplier();
            int perCollectionTopK = Math.max(1, context.getTopK() * Math.max(1, topKMultiplier));
            List<RetrievedChunk> allChunks = retrieveFromAllCollections(
                    context.getMainQuestion(),
                    targets,
                    perCollectionTopK
            );

            long latency = System.currentTimeMillis() - startTime;

            log.info("向量全局检索完成，检索到 {} 个 Chunk，耗时 {}ms", allChunks.size(), latency);

            return SearchChannelResult.builder()
                    .channelType(SearchChannelType.VECTOR_GLOBAL)
                    .channelName(getName())
                    .chunks(allChunks)
                    .confidence(0.7)  // 全局检索置信度中等
                    .latencyMs(latency)
                    .build();

        } catch (Exception e) {
            log.error("向量全局检索失败", e);
            return SearchChannelResult.builder()
                    .channelType(SearchChannelType.VECTOR_GLOBAL)
                    .channelName(getName())
                    .chunks(List.of())
                    .confidence(0.0)
                    .latencyMs(System.currentTimeMillis() - startTime)
                    .build();
        }
    }

    /**
     * 构建全局检索目标：按 collection 去重，并携带该知识库的 embedding 模型（用于查询向量）
     */
    private List<RetrieveRequest> buildGlobalKbRetrieveTargets() {
        List<KnowledgeBaseDO> kbList = knowledgeBaseMapper.selectList(
                Wrappers.lambdaQuery(KnowledgeBaseDO.class)
                        .select(KnowledgeBaseDO::getCollectionName, KnowledgeBaseDO::getEmbeddingModel)
                        .eq(KnowledgeBaseDO::getDeleted, 0)
        );
        Map<String, String> embeddingByCollection = new LinkedHashMap<>();
        for (KnowledgeBaseDO kb : kbList) {
            String collectionName = kb.getCollectionName();
            if (!StringUtils.hasText(collectionName)) {
                continue;
            }
            String trimmed = collectionName.trim();
            embeddingByCollection.putIfAbsent(trimmed, kb.getEmbeddingModel());
        }
        List<RetrieveRequest> targets = new ArrayList<>();
        for (Map.Entry<String, String> e : embeddingByCollection.entrySet()) {
            targets.add(RetrieveRequest.builder()
                    .collectionName(e.getKey())
                    .embeddingModel(e.getValue())
                    .build());
        }
        return targets;
    }

    /**
     * 并行在所有 collection 中检索
     */
    private List<RetrievedChunk> retrieveFromAllCollections(String question,
                                                            List<RetrieveRequest> targets,
                                                            int topK) {
        // 使用模板方法执行并行检索
        return parallelRetriever.executeParallelRetrieval(question, targets, topK);
    }

    @Override
    public SearchChannelType getType() {
        return SearchChannelType.VECTOR_GLOBAL;
    }
}
