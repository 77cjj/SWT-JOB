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

import cn.hutool.core.io.IoUtil;
import cn.hutool.core.util.StrUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.JsonParser;
import com.nageoffer.ai.ragent.deals.config.ReferralDealProperties;
import com.nageoffer.ai.ragent.deals.controller.request.ReferralDealSaveRequest;
import com.nageoffer.ai.ragent.deals.dao.entity.ReferralDealDO;
import com.nageoffer.ai.ragent.deals.dao.mapper.ReferralDealMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * 将 classpath 中的静态薅羊毛种子数据写入数据库（仅补缺，不覆盖已有记录）
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReferralDealSeedService {

    private static final String SEED_PATH = "deals/referral-deals-seed.json";

    private final ReferralDealMapper referralDealMapper;
    private final ReferralDealProperties properties;
    private final ReferralDealSchemaService schemaService;
    private final ObjectMapper objectMapper;

    public int seedMissingFromClasspath() {
        return seedMissingFromClasspath(false);
    }

    /**
     * @param force 为 true 时忽略 auto-seed-missing 配置（管理后台手动触发）
     */
    public int seedMissingFromClasspath(boolean force) {
        if (!force && !properties.isAutoSeedMissing()) {
            return 0;
        }
        schemaService.ensureAiEnabledColumn();
        List<ReferralDealSaveRequest> seeds = loadSeedItems();
        if (seeds.isEmpty()) {
            return 0;
        }
        int inserted = 0;
        for (ReferralDealSaveRequest item : seeds) {
            if (item == null || StrUtil.isBlank(item.getId())) {
                continue;
            }
            String id = item.getId().trim().toLowerCase();
            ReferralDealDO existing = referralDealMapper.selectAnyById(id);
            if (existing != null && (existing.getDeleted() == null || existing.getDeleted() == 0)) {
                continue;
            }
            validateProgramJson(item.getProgramJson());
            ReferralDealDO record = ReferralDealDO.builder()
                    .id(id)
                    .siteRebateUsd(item.getSiteRebateUsd())
                    .siteRebateLabelZh(StrUtil.trim(item.getSiteRebateLabelZh()))
                    .siteRebateLabelEn(StrUtil.trim(item.getSiteRebateLabelEn()))
                    .programJson(item.getProgramJson().trim())
                    .sortOrder(item.getSortOrder() != null ? item.getSortOrder() : 0)
                    .published(item.getPublished() != null ? item.getPublished() : 1)
                    .aiEnabled(item.getAiEnabled() != null ? item.getAiEnabled() : 1)
                    .build();
            if (existing != null) {
                referralDealMapper.restoreAndUpdate(record);
            } else {
                referralDealMapper.insert(record);
            }
            inserted++;
        }
        if (inserted > 0) {
            log.info("薅羊毛种子入库完成，新增 {} 条", inserted);
        }
        return inserted;
    }

    private List<ReferralDealSaveRequest> loadSeedItems() {
        try {
            ClassPathResource resource = new ClassPathResource(SEED_PATH);
            if (!resource.exists()) {
                log.warn("未找到薅羊毛种子文件 {}", SEED_PATH);
                return List.of();
            }
            String json = IoUtil.read(resource.getInputStream(), StandardCharsets.UTF_8);
            JsonNode root = objectMapper.readTree(json);
            JsonNode items = root.get("items");
            if (items == null || !items.isArray()) {
                return List.of();
            }
            List<ReferralDealSaveRequest> result = new ArrayList<>();
            for (JsonNode node : items) {
                ReferralDealSaveRequest item = objectMapper.treeToValue(node, ReferralDealSaveRequest.class);
                if (item != null && StrUtil.isNotBlank(item.getId())) {
                    result.add(item);
                }
            }
            return result;
        } catch (Exception ex) {
            log.error("读取薅羊毛种子文件失败", ex);
            return List.of();
        }
    }

    private void validateProgramJson(String programJson) {
        if (StrUtil.isBlank(programJson)) {
            throw new IllegalStateException("种子数据 programJson 为空");
        }
        JsonParser.parseString(programJson.trim());
    }
}
