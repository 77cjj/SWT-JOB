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

package com.nageoffer.ai.ragent.rag.core.retrieve;

import com.nageoffer.ai.ragent.framework.convention.RetrievedChunk;
import com.nageoffer.ai.ragent.infra.embedding.EmbeddingService;
import com.pgvector.PGvector;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "rag.vector.type", havingValue = "pg")
public class PgRetrieverService implements RetrieverService {

    private final JdbcTemplate jdbcTemplate;
    private final EmbeddingService embeddingService;

    @Override
    public List<RetrievedChunk> retrieve(RetrieveRequest request) {
        List<Float> embedding = StringUtils.hasText(request.getEmbeddingModel())
                ? embeddingService.embed(request.getQuery(), request.getEmbeddingModel())
                : embeddingService.embed(request.getQuery());
        float[] vector = normalize(toArray(embedding));
        return retrieveByVector(vector, request);
    }

    @Override
    public List<RetrievedChunk> retrieveByVector(float[] vector, RetrieveRequest request) {
        String collection = request.getCollectionName() == null ? "" : request.getCollectionName().trim();
        int topK = Math.max(1, request.getTopK());

        // 使用单条连接：注册 vector 类型、SET hnsw.ef_search、绑定 PGvector，避免连接池内 SET 丢失与字符串向量解析问题
        // noinspection SqlDialectInspection,SqlNoDataSourceInspection
        return jdbcTemplate.execute((ConnectionCallback<List<RetrievedChunk>>) conn -> {
            PGvector.addVectorType(conn);
            try (var st = conn.createStatement()) {
                st.execute("SET hnsw.ef_search = 200");
            }
            PGvector queryVec = new PGvector(vector);
            String sql = "SELECT id, content, 1 - (embedding <=> ?::vector) AS score FROM t_knowledge_vector "
                    + "WHERE metadata->>'collection_name' = ? ORDER BY embedding <=> ?::vector LIMIT ?";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setObject(1, queryVec);
                ps.setString(2, collection);
                ps.setObject(3, queryVec);
                ps.setInt(4, topK);
                try (ResultSet rs = ps.executeQuery()) {
                    List<RetrievedChunk> out = new ArrayList<>();
                    while (rs.next()) {
                        out.add(RetrievedChunk.builder()
                                .id(rs.getString("id"))
                                .text(rs.getString("content"))
                                .score(rs.getFloat("score"))
                                .build());
                    }
                    return out;
                }
            }
        });
    }

    private float[] normalize(float[] vector) {
        float norm = 0;
        for (float v : vector) {
            norm += v * v;
        }
        norm = (float) Math.sqrt(norm);
        if (norm > 0) {
            for (int i = 0; i < vector.length; i++) {
                vector[i] /= norm;
            }
        }
        return vector;
    }

    private float[] toArray(List<Float> list) {
        float[] arr = new float[list.size()];
        for (int i = 0; i < list.size(); i++) {
            arr[i] = list.get(i);
        }
        return arr;
    }

}
