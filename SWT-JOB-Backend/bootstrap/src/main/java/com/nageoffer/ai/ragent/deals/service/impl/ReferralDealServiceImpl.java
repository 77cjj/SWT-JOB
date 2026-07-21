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

package com.nageoffer.ai.ragent.deals.service.impl;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.google.gson.JsonParser;
import com.nageoffer.ai.ragent.deals.controller.request.ReferralDealBulkUpsertRequest;
import com.nageoffer.ai.ragent.deals.controller.request.ReferralDealSaveRequest;
import com.nageoffer.ai.ragent.deals.controller.vo.ReferralDealVO;
import com.nageoffer.ai.ragent.deals.dao.entity.ReferralDealDO;
import com.nageoffer.ai.ragent.deals.dao.mapper.ReferralDealMapper;
import com.nageoffer.ai.ragent.deals.service.ReferralDealService;
import com.nageoffer.ai.ragent.framework.exception.ClientException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReferralDealServiceImpl implements ReferralDealService {

    private final ReferralDealMapper referralDealMapper;

    @Override
    public List<ReferralDealVO> listPublic() {
        return referralDealMapper.selectList(
                        Wrappers.lambdaQuery(ReferralDealDO.class)
                                .eq(ReferralDealDO::getDeleted, 0)
                                .eq(ReferralDealDO::getPublished, 1)
                                .orderByAsc(ReferralDealDO::getSortOrder)
                                .orderByAsc(ReferralDealDO::getId)
                ).stream()
                .map(this::toVo)
                .toList();
    }

    @Override
    public ReferralDealVO getPublic(String id) {
        ReferralDealDO record = loadPublished(id);
        return toVo(record);
    }

    @Override
    public List<ReferralDealVO> listAllForAdmin() {
        return referralDealMapper.selectList(
                        Wrappers.lambdaQuery(ReferralDealDO.class)
                                .eq(ReferralDealDO::getDeleted, 0)
                                .orderByAsc(ReferralDealDO::getSortOrder)
                                .orderByAsc(ReferralDealDO::getId)
                ).stream()
                .sorted(Comparator.comparing(ReferralDealDO::getSortOrder, Comparator.nullsLast(Integer::compareTo)))
                .map(this::toVo)
                .toList();
    }

    @Override
    public ReferralDealVO getForAdmin(String id) {
        return toVo(loadAny(id));
    }

    @Override
    public String create(ReferralDealSaveRequest request) {
        validateSave(request);
        String id = normalizeId(request.getId());
        if (referralDealMapper.selectById(id) != null) {
            throw new ClientException("项目 ID 已存在: " + id);
        }
        ReferralDealDO record = toEntity(id, request);
        referralDealMapper.insert(record);
        return id;
    }

    @Override
    public void update(String id, ReferralDealSaveRequest request) {
        validateSave(request);
        ReferralDealDO existing = loadAny(id);
        ReferralDealDO record = toEntity(id, request);
        record.setCreateTime(existing.getCreateTime());
        referralDealMapper.updateById(record);
    }

    @Override
    public void delete(String id) {
        referralDealMapper.deleteById(loadAny(id).getId());
    }

    @Override
    public void bulkUpsert(ReferralDealBulkUpsertRequest request) {
        if (request == null || request.getItems() == null) {
            return;
        }
        for (ReferralDealSaveRequest item : request.getItems()) {
            if (item == null || StrUtil.isBlank(item.getId())) {
                continue;
            }
            String id = normalizeId(item.getId());
            ReferralDealDO existing = referralDealMapper.selectById(id);
            if (existing == null) {
                create(item);
            } else {
                update(id, item);
            }
        }
    }

    private ReferralDealDO loadPublished(String id) {
        ReferralDealDO record = referralDealMapper.selectOne(
                Wrappers.lambdaQuery(ReferralDealDO.class)
                        .eq(ReferralDealDO::getId, id)
                        .eq(ReferralDealDO::getDeleted, 0)
                        .eq(ReferralDealDO::getPublished, 1)
        );
        if (record == null) {
            throw new ClientException("未找到该薅羊毛项目");
        }
        return record;
    }

    private ReferralDealDO loadAny(String id) {
        ReferralDealDO record = referralDealMapper.selectOne(
                Wrappers.lambdaQuery(ReferralDealDO.class)
                        .eq(ReferralDealDO::getId, id)
                        .eq(ReferralDealDO::getDeleted, 0)
        );
        if (record == null) {
            throw new ClientException("未找到该薅羊毛项目");
        }
        return record;
    }

    private void validateSave(ReferralDealSaveRequest request) {
        if (request == null || StrUtil.isBlank(request.getId())) {
            throw new ClientException("项目 ID 不能为空");
        }
        if (StrUtil.isBlank(request.getProgramJson())) {
            throw new ClientException("programJson 不能为空");
        }
        try {
            JsonParser.parseString(request.getProgramJson().trim());
        } catch (Exception ex) {
            throw new ClientException("programJson 不是合法 JSON");
        }
    }

    private String normalizeId(String id) {
        return id.trim().toLowerCase();
    }

    private ReferralDealDO toEntity(String id, ReferralDealSaveRequest request) {
        return ReferralDealDO.builder()
                .id(id)
                .siteRebateUsd(request.getSiteRebateUsd())
                .siteRebateLabelZh(StrUtil.trim(request.getSiteRebateLabelZh()))
                .siteRebateLabelEn(StrUtil.trim(request.getSiteRebateLabelEn()))
                .programJson(request.getProgramJson().trim())
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .published(request.getPublished() != null ? request.getPublished() : 1)
                .build();
    }

    private ReferralDealVO toVo(ReferralDealDO record) {
        Object program;
        try {
            program = JsonParser.parseString(record.getProgramJson()).getAsJsonObject();
        } catch (Exception ex) {
            program = record.getProgramJson();
        }
        return ReferralDealVO.builder()
                .id(record.getId())
                .siteRebateUsd(record.getSiteRebateUsd())
                .siteRebateLabelZh(record.getSiteRebateLabelZh())
                .siteRebateLabelEn(record.getSiteRebateLabelEn())
                .program(program)
                .sortOrder(record.getSortOrder())
                .published(record.getPublished())
                .build();
    }
}
