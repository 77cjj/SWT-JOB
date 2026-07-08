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

package com.nageoffer.ai.ragent.rag.embedding;

import com.nageoffer.ai.ragent.infra.embedding.EmbeddingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

@Slf4j
@SpringBootTest(properties = "spring.config.location=classpath:application-test.yaml")
@RequiredArgsConstructor(onConstructor = @__(@Autowired))
public class BailianEmbeddingServiceTests {

    private final EmbeddingService embeddingService;

    @Test
    public void embeddingBailian() {
        List<Float> embedded = embeddingService.embed("测试向量描述", "text-embedding-v3");
        log.info("百炼 embedding 结果维度: {}", embedded.size());
        log.info("百炼 embedding 结果前5位: {}", embedded.subList(0, Math.min(5, embedded.size())));
    }

    @Test
    public void embeddingBailianBatch() {
        List<List<Float>> embedded = embeddingService.embedBatch(
            List.of("文本1", "文本2", "文本3"), 
            "text-embedding-v3"
        );
        log.info("百炼批量 embedding 结果数量: {}", embedded.size());
        embedded.forEach(v -> log.info("向量维度: {}", v.size()));
    }
}
