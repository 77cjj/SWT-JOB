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

package com.nageoffer.ai.ragent.framework.convention;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * RAG 命中资源引用
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceReference {

    private String title;

    private String url;

    private String snippet;

    /**
     * 较长原文片段，供前端侧栏预览（Markdown 纯文本）
     */
    private String content;

    private Float score;

    private String kbId;

    private String docId;

    private String chunkId;

    /**
     * 资源类型：referral（薅羊毛/refer）、doc（站内文档）、web（联网）
     */
    private String type;

    /**
     * 薅羊毛项目 ID（对应 /deals/{dealId}）
     */
    private String dealId;

    /**
     * 外部邀请/注册链接（referralUrl）
     */
    private String referralUrl;

    /**
     * 官方奖励文案摘要
     */
    private String rewardLabel;

    /**
     * 本站额外返现文案
     */
    private String siteRebateLabel;
}
