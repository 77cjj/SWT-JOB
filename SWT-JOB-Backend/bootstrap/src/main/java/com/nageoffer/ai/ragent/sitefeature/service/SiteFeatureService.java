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

package com.nageoffer.ai.ragent.sitefeature.service;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.nageoffer.ai.ragent.framework.exception.ClientException;
import com.nageoffer.ai.ragent.sitefeature.controller.vo.SiteFeatureFlagVO;
import com.nageoffer.ai.ragent.sitefeature.dao.entity.SiteFeatureFlagDO;
import com.nageoffer.ai.ragent.sitefeature.dao.mapper.SiteFeatureFlagMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class SiteFeatureService {

    public static final Set<String> KNOWN_KEYS = Set.of("chat", "deals", "compare", "jobs", "docs");

    private final SiteFeatureFlagMapper mapper;
    private final SiteFeatureSchemaService schemaService;

    public List<SiteFeatureFlagVO> listFlags() {
        schemaService.ensureSchema();
        List<SiteFeatureFlagDO> rows = mapper.selectList(
                Wrappers.lambdaQuery(SiteFeatureFlagDO.class).orderByAsc(SiteFeatureFlagDO::getSortOrder)
        );
        if (rows.isEmpty()) {
            schemaService.seedDefaults();
            rows = mapper.selectList(
                    Wrappers.lambdaQuery(SiteFeatureFlagDO.class).orderByAsc(SiteFeatureFlagDO::getSortOrder)
            );
        }
        return rows.stream().map(this::toVo).toList();
    }

    public Map<String, Boolean> publicMap() {
        // 安全默认：未读到配置时 jobs/docs 关闭，避免误开放未完成页面
        Map<String, Boolean> map = new LinkedHashMap<>();
        map.put("chat", true);
        map.put("deals", true);
        map.put("compare", true);
        map.put("jobs", false);
        map.put("docs", false);
        for (SiteFeatureFlagVO vo : listFlags()) {
            map.put(vo.getKey(), vo.isEnabled());
        }
        return map;
    }

    @Transactional
    public List<SiteFeatureFlagVO> updateFlags(Map<String, Boolean> flags) {
        schemaService.ensureSchema();
        if (flags == null || flags.isEmpty()) {
            throw new ClientException("请提供要更新的开关");
        }
        Date now = new Date();
        for (Map.Entry<String, Boolean> e : flags.entrySet()) {
            String key = StrUtil.trimToEmpty(e.getKey());
            if (!KNOWN_KEYS.contains(key)) {
                throw new ClientException("未知功能键: " + key);
            }
            if (e.getValue() == null) {
                continue;
            }
            SiteFeatureFlagDO row = mapper.selectById(key);
            if (row == null) {
                row = SiteFeatureFlagDO.builder()
                        .featureKey(key)
                        .enabled(e.getValue() ? 1 : 0)
                        .labelZh(defaultLabel(key))
                        .sortOrder(defaultSort(key))
                        .updateTime(now)
                        .build();
                mapper.insert(row);
            } else {
                row.setEnabled(e.getValue() ? 1 : 0);
                row.setUpdateTime(now);
                mapper.updateById(row);
            }
        }
        return listFlags();
    }

    private SiteFeatureFlagVO toVo(SiteFeatureFlagDO row) {
        return SiteFeatureFlagVO.builder()
                .key(row.getFeatureKey())
                .enabled(row.getEnabled() != null && row.getEnabled() == 1)
                .labelZh(row.getLabelZh())
                .sortOrder(row.getSortOrder() == null ? 0 : row.getSortOrder())
                .build();
    }

    private static String defaultLabel(String key) {
        return switch (key) {
            case "chat" -> "AI问答";
            case "deals" -> "薅羊毛";
            case "compare" -> "选岗计算器";
            case "jobs" -> "岗位情报";
            case "docs" -> "SWT文档";
            default -> key;
        };
    }

    private static int defaultSort(String key) {
        return switch (key) {
            case "chat" -> 10;
            case "deals" -> 20;
            case "compare" -> 30;
            case "jobs" -> 40;
            case "docs" -> 50;
            default -> 99;
        };
    }
}
