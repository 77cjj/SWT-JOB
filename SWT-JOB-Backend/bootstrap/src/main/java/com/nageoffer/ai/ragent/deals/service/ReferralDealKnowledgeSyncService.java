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

package com.nageoffer.ai.ragent.deals.service;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.nageoffer.ai.ragent.deals.config.ReferralDealProperties;
import com.nageoffer.ai.ragent.deals.dao.entity.ReferralDealDO;
import com.nageoffer.ai.ragent.deals.dao.mapper.ReferralDealMapper;
import com.nageoffer.ai.ragent.deals.support.InMemoryMultipartFile;
import com.nageoffer.ai.ragent.deals.support.ReferralDealMarkdownGenerator;
import com.nageoffer.ai.ragent.framework.context.LoginUser;
import com.nageoffer.ai.ragent.framework.context.UserContext;
import com.nageoffer.ai.ragent.knowledge.controller.request.KnowledgeBaseCreateRequest;
import com.nageoffer.ai.ragent.knowledge.controller.request.KnowledgeDocumentUploadRequest;
import com.nageoffer.ai.ragent.knowledge.dao.entity.KnowledgeBaseDO;
import com.nageoffer.ai.ragent.knowledge.dao.entity.KnowledgeDocumentDO;
import com.nageoffer.ai.ragent.knowledge.dao.mapper.KnowledgeBaseMapper;
import com.nageoffer.ai.ragent.knowledge.dao.mapper.KnowledgeDocumentMapper;
import com.nageoffer.ai.ragent.knowledge.enums.SourceType;
import com.nageoffer.ai.ragent.knowledge.service.KnowledgeBaseService;
import com.nageoffer.ai.ragent.knowledge.service.KnowledgeDocumentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 将上架薅羊毛项目同步为知识库 Markdown 文档，供 RAG 检索
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReferralDealKnowledgeSyncService {

    private static final String INDEX_DOC_NAME = "referral-deals-index.md";
    private static final String INDEX_SOURCE = "/deals";

    private final ReferralDealProperties properties;
    private final ReferralDealMapper referralDealMapper;
    private final KnowledgeBaseMapper knowledgeBaseMapper;
    private final KnowledgeDocumentMapper knowledgeDocumentMapper;
    private final KnowledgeBaseService knowledgeBaseService;
    private final KnowledgeDocumentService knowledgeDocumentService;

    @Async
    public void syncAsync() {
        syncNow();
    }

    public void syncNow() {
        if (!properties.isSyncEnabled()) {
            return;
        }
        UserContext.set(LoginUser.builder().username("system").build());
        try {
            String kbId = resolveKnowledgeBaseId();
            if (StrUtil.isBlank(kbId)) {
                log.warn("薅羊毛知识库同步跳过：未找到可用知识库");
                return;
            }
            List<ReferralDealDO> deals = referralDealMapper.selectList(
                    Wrappers.lambdaQuery(ReferralDealDO.class)
                            .eq(ReferralDealDO::getDeleted, 0)
                            .eq(ReferralDealDO::getPublished, 1)
                            .orderByAsc(ReferralDealDO::getSortOrder)
                            .orderByAsc(ReferralDealDO::getId)
            );
            upsertMarkdownDocument(
                    kbId,
                    INDEX_DOC_NAME,
                    INDEX_SOURCE,
                    ReferralDealMarkdownGenerator.generateIndex(deals)
            );
            for (ReferralDealDO deal : deals) {
                String filename = "referral-deal-" + deal.getId() + ".md";
                String source = ReferralDealMarkdownGenerator.dealsSourceLocation(deal.getId());
                upsertMarkdownDocument(
                        kbId,
                        filename,
                        source,
                        ReferralDealMarkdownGenerator.generateDealDocument(deal)
                );
            }
            log.info("薅羊毛知识库同步完成，kbId={} deals={}", kbId, deals.size());
        } catch (Exception ex) {
            log.error("薅羊毛知识库同步失败", ex);
        } finally {
            UserContext.clear();
        }
    }

    private void upsertMarkdownDocument(String kbId, String filename, String sourceLocation, String markdown) {
        KnowledgeDocumentDO existing = knowledgeDocumentMapper.selectOne(
                Wrappers.lambdaQuery(KnowledgeDocumentDO.class)
                        .eq(KnowledgeDocumentDO::getKbId, kbId)
                        .eq(KnowledgeDocumentDO::getSourceLocation, sourceLocation)
                        .eq(KnowledgeDocumentDO::getDeleted, 0)
                        .last("LIMIT 1")
        );
        if (existing != null) {
            knowledgeDocumentService.delete(existing.getId());
        }
        KnowledgeDocumentUploadRequest request = new KnowledgeDocumentUploadRequest();
        request.setSourceType(SourceType.FILE.getValue());
        request.setProcessMode("chunk");
        request.setChunkStrategy("structure_aware");
        request.setChunkConfig("{\"targetChars\":1200,\"maxChars\":1600,\"minChars\":400,\"overlapChars\":80}");
        request.setSourceLocation(sourceLocation);

        var uploaded = knowledgeDocumentService.upload(
                kbId,
                request,
                InMemoryMultipartFile.markdown(filename, markdown)
        );
        knowledgeDocumentService.startChunk(uploaded.getId());
    }

    private String resolveKnowledgeBaseId() {
        if (StrUtil.isNotBlank(properties.getKnowledgeBaseId())) {
            KnowledgeBaseDO kb = knowledgeBaseMapper.selectById(properties.getKnowledgeBaseId());
            if (kb != null && kb.getDeleted() != null && kb.getDeleted() == 0) {
                return kb.getId();
            }
        }
        String name = properties.getKnowledgeBaseName().replaceAll("\\s+", "");
        KnowledgeBaseDO existing = knowledgeBaseMapper.selectOne(
                Wrappers.lambdaQuery(KnowledgeBaseDO.class)
                        .eq(KnowledgeBaseDO::getName, name)
                        .eq(KnowledgeBaseDO::getDeleted, 0)
                        .last("LIMIT 1")
        );
        if (existing != null) {
            return existing.getId();
        }
        KnowledgeBaseCreateRequest createRequest = new KnowledgeBaseCreateRequest();
        createRequest.setName(properties.getKnowledgeBaseName());
        createRequest.setCollectionName(properties.getCollectionName());
        createRequest.setEmbeddingModel("text-embedding-v1");
        return knowledgeBaseService.create(createRequest);
    }
}
