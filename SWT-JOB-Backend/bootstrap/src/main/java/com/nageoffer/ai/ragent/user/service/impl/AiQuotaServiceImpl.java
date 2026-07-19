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

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.nageoffer.ai.ragent.user.dao.entity.UserDO;
import com.nageoffer.ai.ragent.user.dao.mapper.UserMapper;
import com.nageoffer.ai.ragent.user.enums.UserRole;
import com.nageoffer.ai.ragent.user.service.AiQuotaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AiQuotaServiceImpl implements AiQuotaService {

    private static final String DEV_BYPASS_LOGIN_ID = "dev-admin";

    private final UserMapper userMapper;

    @Override
    public boolean tryConsume(String userId) {
        if (StrUtil.isBlank(userId) || DEV_BYPASS_LOGIN_ID.equals(userId)) {
            return true;
        }
        UserDO user = userMapper.selectById(userId);
        if (user == null) {
            return false;
        }
        if (UserRole.ADMIN.getCode().equalsIgnoreCase(user.getRole())) {
            return true;
        }
        int updated = userMapper.update(
                null,
                Wrappers.lambdaUpdate(UserDO.class)
                        .setSql("ai_quota_used = ai_quota_used + 1")
                        .eq(UserDO::getId, userId)
                        .eq(UserDO::getDeleted, 0)
                        .apply("ai_quota_used < ai_quota_total")
        );
        return updated > 0;
    }

    @Override
    public int remainingOf(UserDO user) {
        if (user == null) {
            return 0;
        }
        if (UserRole.ADMIN.getCode().equalsIgnoreCase(user.getRole())
                || DEV_BYPASS_LOGIN_ID.equals(user.getId())) {
            return Integer.MAX_VALUE;
        }
        int total = totalOf(user);
        int used = user.getAiQuotaUsed() == null ? 0 : Math.max(user.getAiQuotaUsed(), 0);
        return Math.max(total - used, 0);
    }

    @Override
    public int totalOf(UserDO user) {
        if (user == null || user.getAiQuotaTotal() == null) {
            return DEFAULT_FREE_QUOTA;
        }
        return Math.max(user.getAiQuotaTotal(), 0);
    }
}
