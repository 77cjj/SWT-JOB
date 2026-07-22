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
import com.nageoffer.ai.ragent.user.controller.vo.LoginVO;
import com.nageoffer.ai.ragent.user.dao.entity.UserDO;
import com.nageoffer.ai.ragent.user.dao.mapper.UserMapper;
import com.nageoffer.ai.ragent.framework.exception.ClientException;
import com.nageoffer.ai.ragent.user.config.AuthProperties;
import com.nageoffer.ai.ragent.user.service.GoogleOAuthService;
import com.nageoffer.ai.ragent.user.service.GoogleOAuthService.VerifiedGoogleUser;
import com.nageoffer.ai.ragent.user.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final String DEFAULT_AVATAR_URL = "https://avatars.githubusercontent.com/u/583231?v=4";
    private static final String DEV_BYPASS_LOGIN_ID = "dev-admin";

    private final UserMapper userMapper;
    private final GoogleOAuthService googleOAuthService;
    private final AuthProperties authProperties;

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
    public LoginVO loginWithGoogle(String idToken) {
        VerifiedGoogleUser googleUser = googleOAuthService.verifyIdToken(idToken);
        UserDO user = findByUsername(googleUser.email());
        if (user == null) {
            user = UserDO.builder()
                    .username(googleUser.email())
                    .password("oauth:" + UUID.randomUUID())
                    .role("user")
                    .avatar(StrUtil.blankToDefault(googleUser.picture(), DEFAULT_AVATAR_URL))
                    .freeChatRemaining(Math.max(0, authProperties.getNewUserFreeChatQuota()))
                    .build();
            userMapper.insert(user);
        } else if (StrUtil.isNotBlank(googleUser.picture()) && StrUtil.isBlank(user.getAvatar())) {
            user.setAvatar(googleUser.picture());
            userMapper.updateById(user);
        }
        if (user.getId() == null) {
            throw new ClientException("Google 登录失败：用户创建异常");
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
        String configuredUser = StrUtil.trimToEmpty(authProperties.getDevBypassUsername());
        String configuredPass = authProperties.getDevBypassPassword();
        if (StrUtil.isBlank(configuredPass) || StrUtil.isBlank(configuredUser)) {
            return false;
        }
        return configuredUser.equalsIgnoreCase(StrUtil.trim(username))
                && configuredPass.equals(password);
    }
}
