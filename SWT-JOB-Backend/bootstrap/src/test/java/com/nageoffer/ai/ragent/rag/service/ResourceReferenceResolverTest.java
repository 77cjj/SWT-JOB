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

import com.nageoffer.ai.ragent.framework.convention.ResourceReference;
import com.nageoffer.ai.ragent.framework.convention.RetrievedChunk;
import com.nageoffer.ai.ragent.knowledge.dao.entity.KnowledgeChunkDO;
import com.nageoffer.ai.ragent.knowledge.dao.entity.KnowledgeDocumentDO;
import com.nageoffer.ai.ragent.knowledge.dao.mapper.KnowledgeChunkMapper;
import com.nageoffer.ai.ragent.knowledge.dao.mapper.KnowledgeDocumentMapper;
import com.nageoffer.ai.ragent.rag.dto.RetrievalContext;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ResourceReferenceResolverTest {

    @Mock
    private KnowledgeChunkMapper knowledgeChunkMapper;

    @Mock
    private KnowledgeDocumentMapper knowledgeDocumentMapper;

    @Test
    void resolvesImportedDocumentWhenOptionalLocationsAreNull() {
        RetrievedChunk retrieved = RetrievedChunk.builder()
                .id("chunk-1")
                .text("美国共有 50 个州。")
                .score(0.95F)
                .build();
        KnowledgeChunkDO chunk = KnowledgeChunkDO.builder()
                .id("chunk-1")
                .kbId("kb-1")
                .docId("doc-1")
                .content("美国共有 50 个州。")
                .build();
        KnowledgeDocumentDO document = KnowledgeDocumentDO.builder()
                .id("doc-1")
                .docName("美国州信息")
                .sourceLocation(null)
                .fileUrl(null)
                .build();

        when(knowledgeChunkMapper.selectBatchIds(List.of("chunk-1"))).thenReturn(List.of(chunk));
        when(knowledgeDocumentMapper.selectList(any())).thenReturn(List.of(document));

        ResourceReferenceResolver resolver = new ResourceReferenceResolver(
                knowledgeChunkMapper,
                knowledgeDocumentMapper
        );
        RetrievalContext context = RetrievalContext.builder()
                .intentChunks(Map.of("general", List.of(retrieved)))
                .build();

        List<ResourceReference> resources = resolver.resolve(context);

        assertEquals(1, resources.size());
        assertEquals("美国州信息", resources.get(0).getTitle());
    }
}
