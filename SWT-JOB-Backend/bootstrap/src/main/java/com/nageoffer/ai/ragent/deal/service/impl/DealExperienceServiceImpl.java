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

package com.nageoffer.ai.ragent.deal.service.impl;

import cn.hutool.core.date.DateUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.nageoffer.ai.ragent.deal.controller.request.DealExperienceCreateRequest;
import com.nageoffer.ai.ragent.deal.controller.vo.DealExperienceVO;
import com.nageoffer.ai.ragent.deal.dao.entity.DealExperienceDO;
import com.nageoffer.ai.ragent.deal.dao.mapper.DealExperienceMapper;
import com.nageoffer.ai.ragent.deal.service.DealExperienceService;
import com.nageoffer.ai.ragent.framework.context.UserContext;
import com.nageoffer.ai.ragent.framework.exception.ClientException;
import com.nageoffer.ai.ragent.user.controller.request.UserProfileUpdateRequest;
import com.nageoffer.ai.ragent.user.dao.entity.UserDO;
import com.nageoffer.ai.ragent.user.dao.entity.UserProfileDO;
import com.nageoffer.ai.ragent.user.dao.mapper.UserMapper;
import com.nageoffer.ai.ragent.user.dao.mapper.UserProfileMapper;
import com.nageoffer.ai.ragent.user.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DealExperienceServiceImpl implements DealExperienceService {

    private final DealExperienceMapper dealExperienceMapper;
    private final UserProfileMapper userProfileMapper;
    private final UserMapper userMapper;
    private final UserProfileService userProfileService;
    private final ObjectMapper objectMapper;

    @Override
    public List<DealExperienceVO> listByProgram(String programId, String editionId) {
        if (StrUtil.isBlank(programId)) {
            throw new ClientException("programId 不能为空");
        }
        List<DealExperienceDO> records = dealExperienceMapper.selectList(
                Wrappers.lambdaQuery(DealExperienceDO.class)
                        .eq(DealExperienceDO::getProgramId, programId)
                        .eq(DealExperienceDO::getDeleted, 0)
                        .eq(StrUtil.isNotBlank(editionId), DealExperienceDO::getEditionId, editionId)
                        .orderByDesc(DealExperienceDO::getReportedAt)
                        .orderByDesc(DealExperienceDO::getCreateTime)
        );
        return records.stream().map(this::toVO).collect(Collectors.toList());
    }

    @Override
    public List<DealExperienceVO> listByUser(String userId) {
        if (StrUtil.isBlank(userId)) {
            throw new ClientException("userId 不能为空");
        }
        List<DealExperienceDO> records = dealExperienceMapper.selectList(
                Wrappers.lambdaQuery(DealExperienceDO.class)
                        .eq(DealExperienceDO::getUserId, userId)
                        .eq(DealExperienceDO::getDeleted, 0)
                        .orderByDesc(DealExperienceDO::getReportedAt)
                        .orderByDesc(DealExperienceDO::getCreateTime)
        );
        return records.stream().map(this::toVO).collect(Collectors.toList());
    }

    @Override
    public String create(DealExperienceCreateRequest request) {
        String userId = UserContext.requireUser().getUserId();
        if (StrUtil.isBlank(request.getProgramId())) {
            throw new ClientException("programId 不能为空");
        }
        String bodyZh = StrUtil.trimToNull(request.getBodyZh());
        String bodyEn = StrUtil.trimToNull(request.getBodyEn());
        if (StrUtil.isBlank(bodyZh) && StrUtil.isBlank(bodyEn)) {
            throw new ClientException("亲测描述不能为空");
        }
        if (StrUtil.isBlank(bodyEn)) {
            bodyEn = bodyZh;
        }
        if (StrUtil.isBlank(bodyZh)) {
            bodyZh = bodyEn;
        }

        if (StrUtil.isNotBlank(request.getProfileVisibility())) {
            UserProfileUpdateRequest profileUpdate = new UserProfileUpdateRequest();
            profileUpdate.setProfileVisibility(request.getProfileVisibility());
            userProfileService.updateMyProfile(profileUpdate);
        }

        incrementContribution(userId);

        DealExperienceDO record = DealExperienceDO.builder()
                .userId(userId)
                .programId(request.getProgramId().trim())
                .editionId(StrUtil.trimToNull(request.getEditionId()))
                .reportedAt(new Date())
                .bodyZh(bodyZh)
                .bodyEn(bodyEn)
                .detailJson(buildDetailJson(request))
                .build();
        dealExperienceMapper.insert(record);
        return String.valueOf(record.getId());
    }

    @Override
    public void deleteOwn(String id) {
        String userId = UserContext.requireUser().getUserId();
        DealExperienceDO record = dealExperienceMapper.selectById(id);
        if (record == null || record.getDeleted() != null && record.getDeleted() == 1) {
            throw new ClientException("记录不存在");
        }
        if (!userId.equals(record.getUserId()) && !"admin".equals(UserContext.requireUser().getRole())) {
            throw new ClientException("无权删除该记录");
        }
        dealExperienceMapper.deleteById(id);
    }

    private void incrementContribution(String userId) {
        UserProfileDO profile = userProfileMapper.selectOne(
                Wrappers.lambdaQuery(UserProfileDO.class)
                        .eq(UserProfileDO::getUserId, userId)
                        .eq(UserProfileDO::getDeleted, 0)
        );
        if (profile == null) {
            userProfileService.createDefaultProfile(userId, null, null, "consent");
            profile = userProfileMapper.selectOne(
                    Wrappers.lambdaQuery(UserProfileDO.class)
                            .eq(UserProfileDO::getUserId, userId)
                            .eq(UserProfileDO::getDeleted, 0)
            );
        }
        if (profile != null) {
            int count = profile.getContributionCount() != null ? profile.getContributionCount() : 0;
            profile.setContributionCount(count + 1);
            userProfileMapper.updateById(profile);
        }
    }

    private String buildDetailJson(DealExperienceCreateRequest request) {
        try {
            ObjectNode root = objectMapper.createObjectNode();
            if (StrUtil.isNotBlank(request.getOpeningMethodZh()) || StrUtil.isNotBlank(request.getOpeningMethodEn())) {
                ObjectNode opening = root.putObject("openingMethod");
                opening.put("zh", StrUtil.blankToDefault(request.getOpeningMethodZh(), request.getOpeningMethodEn()));
                opening.put("en", StrUtil.blankToDefault(request.getOpeningMethodEn(), request.getOpeningMethodZh()));
            }
            if (StrUtil.isNotBlank(request.getDdMethodZh()) || StrUtil.isNotBlank(request.getDdMethodEn())) {
                ObjectNode dd = root.putObject("ddMethod");
                dd.put("zh", StrUtil.blankToDefault(request.getDdMethodZh(), request.getDdMethodEn()));
                dd.put("en", StrUtil.blankToDefault(request.getDdMethodEn(), request.getDdMethodZh()));
            }
            if (StrUtil.isNotBlank(request.getMaterialsZh()) || StrUtil.isNotBlank(request.getMaterialsEn())) {
                ObjectNode materials = root.putObject("materials");
                materials.set("zh", toArrayNode(splitMaterials(request.getMaterialsZh())));
                materials.set("en", toArrayNode(splitMaterials(
                        StrUtil.blankToDefault(request.getMaterialsEn(), request.getMaterialsZh()))));
            }
            if (StrUtil.isNotBlank(request.getDdDate())) {
                root.put("ddDate", request.getDdDate().trim());
            }
            if (StrUtil.isNotBlank(request.getBonusReceivedDate())) {
                root.put("bonusReceivedDate", request.getBonusReceivedDate().trim());
            }
            if (StrUtil.isNotBlank(request.getBonusAmount())) {
                root.put("bonusAmount", request.getBonusAmount().trim());
            }
            return root.isEmpty() ? null : objectMapper.writeValueAsString(root);
        } catch (Exception ex) {
            throw new ClientException("详情 JSON 构建失败");
        }
    }

    private ArrayNode toArrayNode(List<String> items) {
        ArrayNode arrayNode = objectMapper.createArrayNode();
        for (String item : items) {
            arrayNode.add(item);
        }
        return arrayNode;
    }

    private List<String> splitMaterials(String raw) {
        if (StrUtil.isBlank(raw)) {
            return List.of();
        }
        return List.of(raw.split("[,，、]")).stream().map(String::trim).filter(StrUtil::isNotBlank).collect(Collectors.toList());
    }

    private DealExperienceVO toVO(DealExperienceDO record) {
        UserDO user = userMapper.selectById(record.getUserId());
        UserProfileDO profile = userProfileMapper.selectOne(
                Wrappers.lambdaQuery(UserProfileDO.class)
                        .eq(UserProfileDO::getUserId, record.getUserId())
                        .eq(UserProfileDO::getDeleted, 0)
        );
        String displayName = profile != null && StrUtil.isNotBlank(profile.getDisplayName())
                ? profile.getDisplayName()
                : (user != null ? user.getUsername() : "用户");
        String avatarColor = profile != null && StrUtil.isNotBlank(profile.getAvatarColor())
                ? profile.getAvatarColor()
                : "#6366f1";
        return DealExperienceVO.builder()
                .id(record.getId())
                .userId(record.getUserId())
                .programId(record.getProgramId())
                .editionId(record.getEditionId())
                .reportedAt(record.getReportedAt() != null ? DateUtil.formatDate(record.getReportedAt()) : null)
                .bodyZh(record.getBodyZh())
                .bodyEn(record.getBodyEn())
                .detailJson(record.getDetailJson())
                .authorDisplayName(displayName)
                .authorAvatarUrl(user != null ? user.getAvatar() : null)
                .authorAvatarColor(avatarColor)
                .build();
    }
}
