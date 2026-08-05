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

package com.nageoffer.ai.ragent.deals.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "rag.referral-deals")
public class ReferralDealProperties {

    /**
     * 是否将上架薅羊毛项目同步到知识库（供 RAG 检索）
     */
    private boolean syncEnabled = true;

    /**
     * 知识库 ID；为空时按 knowledge-base-name 查找，找不到则自动创建
     */
    private String knowledgeBaseId;

    /**
     * 自动查找/创建的知识库名称
     */
    private String knowledgeBaseName = "SWT薅羊毛";

    /**
     * 向量 Collection 名称（自动创建知识库时使用）
     */
    private String collectionName = "swt_referral_deals_store";

    /**
     * 是否在应用启动后自动补缺静态种子到数据库
     */
    private boolean autoSeedMissing = true;

    /**
     * 是否在应用启动后异步同步
     */
    private boolean syncOnStartup = true;

    /**
     * 问答时是否根据问题注入薅羊毛资源卡片
     */
    private boolean injectResources = true;

    /**
     * 问题匹配时最多注入几条 refer 资源
     */
    private int maxInjectCount = 3;
}
