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

package com.nageoffer.ai.ragent.rag.service;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.nageoffer.ai.ragent.framework.convention.ResourceReference;
import com.nageoffer.ai.ragent.framework.convention.RetrievedChunk;
import com.nageoffer.ai.ragent.knowledge.dao.entity.KnowledgeChunkDO;
import com.nageoffer.ai.ragent.knowledge.dao.entity.KnowledgeDocumentDO;
import com.nageoffer.ai.ragent.knowledge.dao.mapper.KnowledgeChunkMapper;
import com.nageoffer.ai.ragent.knowledge.dao.mapper.KnowledgeDocumentMapper;
import com.nageoffer.ai.ragent.rag.dto.RetrievalContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * 将检索结果解析为可展示资源引用
 */
@Service
@RequiredArgsConstructor
public class ResourceReferenceResolver {

    private final KnowledgeChunkMapper knowledgeChunkMapper;
    private final KnowledgeDocumentMapper knowledgeDocumentMapper;

    public List<ResourceReference> resolve(RetrievalContext retrievalContext) {
        if (retrievalContext == null || retrievalContext.getIntentChunks() == null || retrievalContext.getIntentChunks().isEmpty()) {
            return List.of();
        }

        Map<String, RetrievedChunk> topChunkById = new LinkedHashMap<>();
        retrievalContext.getIntentChunks().values().stream()
                .flatMap(List::stream)
                .filter(Objects::nonNull)
                .forEach(chunk -> {
                    if (StrUtil.isBlank(chunk.getId())) {
                        return;
                    }
                    RetrievedChunk current = topChunkById.get(chunk.getId());
                    if (current == null || (chunk.getScore() != null && (current.getScore() == null || chunk.getScore() > current.getScore()))) {
                        topChunkById.put(chunk.getId(), chunk);
                    }
                });
        if (topChunkById.isEmpty()) {
            return List.of();
        }

        List<String> chunkIds = topChunkById.keySet().stream().toList();
        List<KnowledgeChunkDO> chunkRecords = knowledgeChunkMapper.selectBatchIds(chunkIds);
        if (chunkRecords == null || chunkRecords.isEmpty()) {
            return List.of();
        }

        Map<String, KnowledgeChunkDO> chunkById = chunkRecords.stream()
                .filter(each -> each != null && StrUtil.isNotBlank(each.getId()))
                .collect(java.util.stream.Collectors.toMap(KnowledgeChunkDO::getId, each -> each, (a, b) -> a));
        List<String> docIds = chunkById.values().stream().map(KnowledgeChunkDO::getDocId).filter(StrUtil::isNotBlank).distinct().toList();
        Map<String, KnowledgeDocumentDO> docById = loadDocMap(docIds);

        Map<String, ResourceReference> deduplicated = new LinkedHashMap<>();
        for (String chunkId : chunkIds) {
            KnowledgeChunkDO chunk = chunkById.get(chunkId);
            if (chunk == null) {
                continue;
            }
            KnowledgeDocumentDO doc = docById.get(chunk.getDocId());
            String url = resolveUrl(doc);
            if (StrUtil.isBlank(url)) {
                continue;
            }
            RetrievedChunk retrievedChunk = topChunkById.get(chunkId);
            ResourceReference resource = ResourceReference.builder()
                    .title(doc != null ? doc.getDocName() : null)
                    .url(url)
                    .snippet(buildSnippet(chunk.getContent()))
                    .score(retrievedChunk != null ? retrievedChunk.getScore() : null)
                    .kbId(chunk.getKbId())
                    .docId(chunk.getDocId())
                    .chunkId(chunk.getId())
                    .build();
            String key = StrUtil.isNotBlank(resource.getUrl()) ? resource.getUrl() : resource.getChunkId();
            deduplicated.putIfAbsent(key, resource);
        }
        return deduplicated.values().stream().toList();
    }

    private Map<String, KnowledgeDocumentDO> loadDocMap(List<String> docIds) {
        if (docIds == null || docIds.isEmpty()) {
            return Map.of();
        }
        List<KnowledgeDocumentDO> documents = knowledgeDocumentMapper.selectList(
                Wrappers.lambdaQuery(KnowledgeDocumentDO.class)
                        .in(KnowledgeDocumentDO::getId, docIds)
                        .eq(KnowledgeDocumentDO::getDeleted, 0)
        );
        if (documents == null || documents.isEmpty()) {
            return Map.of();
        }
        return documents.stream()
                .filter(each -> each != null && StrUtil.isNotBlank(each.getId()))
                .collect(java.util.stream.Collectors.toMap(KnowledgeDocumentDO::getId, each -> each, (a, b) -> a));
    }

    private String resolveUrl(KnowledgeDocumentDO documentDO) {
        if (documentDO == null) {
            return null;
        }
        if (StrUtil.isNotBlank(documentDO.getSourceLocation())) {
            return documentDO.getSourceLocation();
        }
        return documentDO.getFileUrl();
    }

    private String buildSnippet(String content) {
        if (StrUtil.isBlank(content)) {
            return null;
        }
        String trimmed = content.trim();
        return trimmed.length() > 160 ? trimmed.substring(0, 160) + "..." : trimmed;
    }
}
