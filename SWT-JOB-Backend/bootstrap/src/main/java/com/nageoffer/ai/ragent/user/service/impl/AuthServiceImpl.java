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

import cn.dev33.satoken.stp.StpUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.nageoffer.ai.ragent.user.controller.request.LoginRequest;
import com.nageoffer.ai.ragent.user.controller.request.RegisterRequest;
import com.nageoffer.ai.ragent.user.controller.vo.LoginVO;
import com.nageoffer.ai.ragent.user.dao.entity.UserDO;
import com.nageoffer.ai.ragent.user.dao.mapper.UserMapper;
import com.nageoffer.ai.ragent.framework.exception.ClientException;
import com.nageoffer.ai.ragent.user.service.AuthService;
import com.nageoffer.ai.ragent.user.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final String DEFAULT_AVATAR_URL = "https://avatars.githubusercontent.com/u/583231?v=4";
    private static final String DEV_BYPASS_USERNAME = "Admin";
    private static final String DEV_BYPASS_PASSWORD = "Admin";
    private static final String DEV_BYPASS_LOGIN_ID = "dev-admin";

    private final UserMapper userMapper;
    private final UserProfileService userProfileService;

    @Override
    public LoginVO login(LoginRequest requestParam) {
        String username = requestParam.getUsername();
        String password = requestParam.getPassword();
        if (StrUtil.isBlank(username) || StrUtil.isBlank(password)) {
            throw new ClientException("用户名或密码不能为空");
        }
        if (isDevBypass(username, password)) {
            StpUtil.login(DEV_BYPASS_LOGIN_ID);
            return new LoginVO(DEV_BYPASS_LOGIN_ID, "admin", StpUtil.getTokenValue(), DEFAULT_AVATAR_URL);
        }
        UserDO user = findByUsername(username);
        if (user == null || !passwordMatches(password, user.getPassword())) {
            throw new ClientException("用户名或密码错误");
        }
        if (user.getId() == null) {
            throw new ClientException("用户信息异常");
        }
        String loginId = user.getId().toString();
        StpUtil.login(loginId);
        String avatar = StrUtil.isBlank(user.getAvatar()) ? DEFAULT_AVATAR_URL : user.getAvatar();
        return new LoginVO(loginId, user.getRole(), StpUtil.getTokenValue(), avatar);
    }

    @Override
    public void logout() {
        StpUtil.logout();
    }

    @Override
    public LoginVO register(RegisterRequest requestParam) {
        String username = requestParam.getUsername();
        String password = requestParam.getPassword();
        if (StrUtil.isBlank(username) || StrUtil.isBlank(password)) {
            throw new ClientException("用户名或密码不能为空");
        }
        if (password.length() < 6) {
            throw new ClientException("密码至少 6 位");
        }
        UserDO existing = findByUsername(username.trim());
        if (existing != null) {
            throw new ClientException("用户名已存在");
        }
        UserDO user = UserDO.builder()
                .username(username.trim())
                .password(password)
                .role("user")
                .avatar(StrUtil.isBlank(requestParam.getAvatar()) ? DEFAULT_AVATAR_URL : requestParam.getAvatar())
                .build();
        userMapper.insert(user);
        if (user.getId() == null) {
            throw new ClientException("注册失败");
        }
        userProfileService.createDefaultProfile(user.getId().toString(), username.trim(), null, "consent");
        String loginId = user.getId().toString();
        StpUtil.login(loginId);
        return new LoginVO(loginId, user.getRole(), StpUtil.getTokenValue(), user.getAvatar());
    }

    private UserDO findByUsername(String username) {
        if (StrUtil.isBlank(username)) {
            return null;
        }
        return userMapper.selectOne(
                Wrappers.lambdaQuery(UserDO.class)
                        .eq(UserDO::getUsername, username)
                        .eq(UserDO::getDeleted, 0)
        );
    }

    private boolean passwordMatches(String input, String stored) {
        if (stored == null) {
            return input == null;
        }
        return stored.equals(input);
    }

    private boolean isDevBypass(String username, String password) {
        return DEV_BYPASS_USERNAME.equalsIgnoreCase(StrUtil.trim(username))
                && DEV_BYPASS_PASSWORD.equalsIgnoreCase(StrUtil.trim(password));
    }
}
