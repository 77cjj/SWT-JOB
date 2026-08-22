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

package com.nageoffer.ai.ragent.rag.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * RAG 检索配置
 */
@Data
@Component
@ConfigurationProperties(prefix = "rag.search")
public class SearchChannelProperties {

    /**
     * 检索通道配置
     */
    private Channels channels = new Channels();

    @Data
    public static class Channels {

        /**
         * 单通道超时上限（毫秒）
         * <p>
         * 超时通道按空结果降级，其余通道照常融合；{@code <= 0} 表示不限时
         */
        private long timeoutMs = 15000;

        /**
         * 向量全局检索配置
         */
        private VectorGlobal vectorGlobal = new VectorGlobal();

        /**
         * 意图定向检索配置
         */
        private IntentDirected intentDirected = new IntentDirected();
    }

    @Data
    public static class VectorGlobal {

        /**
         * 是否启用
         */
        private boolean enabled = true;

        /**
         * 是否与意图定向检索并行执行。
         *
         * 高置信度并不等于分类一定正确。开启后，KB 问题会同时走全库向量召回，
         * 再交给去重和重排处理器统一筛选，避免“高置信度误判”导致完全查不到正确文档。
         */
        private boolean alwaysRun = true;

        /**
         * 意图置信度阈值
         * alwaysRun 关闭时，意图识别的最高分数低于此阈值才启用全局检索
         */
        private double confidenceThreshold = 0.6;

        /**
         * TopK 倍数
         * 全局检索时召回更多候选，后续通过 Rerank 筛选
         */
        private int topKMultiplier = 3;
    }

    @Data
    public static class IntentDirected {

        /**
         * 是否启用
         */
        private boolean enabled = true;

        /**
         * 最低意图分数
         * 低于此分数的意图节点会被过滤
         */
        private double minIntentScore = 0.4;

        /**
         * TopK 倍数
         */
        private int topKMultiplier = 2;
    }
}
