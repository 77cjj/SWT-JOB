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

package com.nageoffer.ai.ragent.knowledge.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 文档分块任务：RocketMQ 异步 vs 进程内异步（小内存 / 未部署 MQ 时使用后者）
 */
@Data
@ConfigurationProperties(prefix = "rag.knowledge.chunk")
public class KnowledgeChunkProperties {

    /**
     * true：走 RocketMQ 事务消息（需 NameServer + Broker + 消费者）
     * false：HTTP 触发后在 JVM 内异步 executeChunk（与 server.sh 关 MQ 消费者配套）
     */
    private boolean useMessageQueue = true;
}
