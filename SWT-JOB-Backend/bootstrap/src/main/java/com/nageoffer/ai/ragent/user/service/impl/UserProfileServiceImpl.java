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

package com.nageoffer.ai.ragent.user.service.impl;

import cn.hutool.core.date.DateUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.nageoffer.ai.ragent.framework.context.UserContext;
import com.nageoffer.ai.ragent.framework.exception.ClientException;
import com.nageoffer.ai.ragent.user.controller.request.UserProfileUpdateRequest;
import com.nageoffer.ai.ragent.user.controller.vo.UserProfileVO;
import com.nageoffer.ai.ragent.user.dao.entity.UserDO;
import com.nageoffer.ai.ragent.user.dao.entity.UserProfileDO;
import com.nageoffer.ai.ragent.user.dao.mapper.UserMapper;
import com.nageoffer.ai.ragent.user.dao.mapper.UserProfileMapper;
import com.nageoffer.ai.ragent.user.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserProfileServiceImpl implements UserProfileService {

    private static final String DEFAULT_VISIBILITY = "consent";
    private static final String[] AVATAR_COLORS = {"#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"};

    private final UserProfileMapper userProfileMapper;
    private final UserMapper userMapper;

    @Override
    public UserProfileVO getMyProfile() {
        String userId = UserContext.requireUser().getUserId();
        UserProfileDO profile = loadOrCreateProfile(userId);
        return toVO(profile, userId, userId);
    }

    @Override
    public UserProfileVO updateMyProfile(UserProfileUpdateRequest request) {
        String userId = UserContext.requireUser().getUserId();
        UserProfileDO profile = loadOrCreateProfile(userId);
        if (request.getDisplayName() != null) {
            profile.setDisplayName(StrUtil.trimToNull(request.getDisplayName()));
        }
        if (request.getAvatarColor() != null) {
            profile.setAvatarColor(StrUtil.trimToNull(request.getAvatarColor()));
        }
        if (request.getBio() != null) {
            profile.setBio(StrUtil.trimToNull(request.getBio()));
        }
        if (request.getProgramYear() != null) {
            profile.setProgramYear(StrUtil.trimToNull(request.getProgramYear()));
        }
        if (request.getWorkState() != null) {
            profile.setWorkState(StrUtil.trimToNull(request.getWorkState()));
        }
        if (request.getJobTitle() != null) {
            profile.setJobTitle(StrUtil.trimToNull(request.getJobTitle()));
        }
        if (request.getPhone() != null) {
            profile.setPhone(StrUtil.trimToNull(request.getPhone()));
        }
        if (request.getEmail() != null) {
            profile.setEmail(StrUtil.trimToNull(request.getEmail()));
        }
        if (request.getWechat() != null) {
            profile.setWechat(StrUtil.trimToNull(request.getWechat()));
        }
        if (request.getProfileVisibility() != null) {
            profile.setProfileVisibility(normalizeVisibility(request.getProfileVisibility()));
        }
        userProfileMapper.updateById(profile);
        return toVO(profile, userId, userId);
    }

    @Override
    public UserProfileVO getProfileForViewer(String userId, String viewerUserId) {
        if (StrUtil.isBlank(userId)) {
            throw new ClientException("用户不存在");
        }
        UserProfileDO profile = findByUserId(userId);
        if (profile == null) {
            throw new ClientException("用户不存在");
        }
        return toVO(profile, userId, viewerUserId);
    }

    @Override
    public void createDefaultProfile(String userId, String displayName, String email, String profileVisibility) {
        if (findByUserId(userId) != null) {
            return;
        }
        UserProfileDO record = UserProfileDO.builder()
                .userId(userId)
                .displayName(StrUtil.blankToDefault(displayName, "用户"))
                .avatarColor(pickColor(userId))
                .bio("")
                .email(StrUtil.trimToNull(email))
                .profileVisibility(normalizeVisibility(profileVisibility))
                .contributionCount(0)
                .build();
        userProfileMapper.insert(record);
    }

    UserProfileDO loadOrCreateProfile(String userId) {
        UserProfileDO profile = findByUserId(userId);
        if (profile != null) {
            return profile;
        }
        UserDO user = userMapper.selectById(userId);
        createDefaultProfile(userId, user != null ? user.getUsername() : "用户", null, DEFAULT_VISIBILITY);
        return findByUserId(userId);
    }

    UserProfileDO findByUserId(String userId) {
        return userProfileMapper.selectOne(
                Wrappers.lambdaQuery(UserProfileDO.class)
                        .eq(UserProfileDO::getUserId, userId)
                        .eq(UserProfileDO::getDeleted, 0)
        );
    }

    private UserProfileVO toVO(UserProfileDO profile, String ownerUserId, String viewerUserId) {
        UserDO user = userMapper.selectById(ownerUserId);
        boolean isOwner = StrUtil.isNotBlank(viewerUserId) && viewerUserId.equals(ownerUserId);
        boolean showContact = isOwner || "public".equalsIgnoreCase(profile.getProfileVisibility());
        String displayName = StrUtil.blankToDefault(profile.getDisplayName(),
                user != null ? user.getUsername() : "用户");
        return UserProfileVO.builder()
                .userId(ownerUserId)
                .displayName(displayName)
                .avatarUrl(user != null ? user.getAvatar() : null)
                .avatarColor(StrUtil.blankToDefault(profile.getAvatarColor(), pickColor(ownerUserId)))
                .bio(StrUtil.blankToDefault(profile.getBio(), ""))
                .programYear(profile.getProgramYear())
                .workState(profile.getWorkState())
                .jobTitle(profile.getJobTitle())
                .phone(showContact ? profile.getPhone() : null)
                .email(showContact ? profile.getEmail() : null)
                .wechat(showContact ? profile.getWechat() : null)
                .profileVisibility(StrUtil.blankToDefault(profile.getProfileVisibility(), DEFAULT_VISIBILITY))
                .badge(profile.getBadge())
                .contributionCount(profile.getContributionCount() != null ? profile.getContributionCount() : 0)
                .joinedAt(profile.getCreateTime() != null ? DateUtil.formatDate(profile.getCreateTime()) : null)
                .contactHidden(!showContact)
                .build();
    }

    private String normalizeVisibility(String value) {
        if ("public".equalsIgnoreCase(StrUtil.trim(value))) {
            return "public";
        }
        return DEFAULT_VISIBILITY;
    }

    private String pickColor(String userId) {
        int idx = Math.abs(userId.hashCode()) % AVATAR_COLORS.length;
        return AVATAR_COLORS[idx];
    }
}
