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
import com.nageoffer.ai.ragent.user.config.AuthProperties;
import com.nageoffer.ai.ragent.user.service.AppleOAuthService;
import com.nageoffer.ai.ragent.user.service.AppleOAuthService.VerifiedAppleUser;
import com.nageoffer.ai.ragent.user.service.GoogleOAuthService;
import com.nageoffer.ai.ragent.user.service.GoogleOAuthService.VerifiedGoogleUser;
import com.nageoffer.ai.ragent.user.service.WeChatOAuthService;
import com.nageoffer.ai.ragent.user.service.WeChatOAuthService.VerifiedWeChatUser;
import com.nageoffer.ai.ragent.user.service.AuthService;
import com.nageoffer.ai.ragent.user.service.UserSchemaService;
import com.nageoffer.ai.ragent.user.util.PasswordHasher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final String DEFAULT_AVATAR_URL = "https://avatars.githubusercontent.com/u/583231?v=4";
    private static final String DEV_BYPASS_LOGIN_ID = "dev-admin";
    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_\\u4e00-\\u9fff]{3,32}$");

    private final UserMapper userMapper;
    private final GoogleOAuthService googleOAuthService;
    private final AppleOAuthService appleOAuthService;
    private final WeChatOAuthService weChatOAuthService;
    private final AuthProperties authProperties;
    private final UserSchemaService userSchemaService;

    @Override
    public LoginVO login(LoginRequest requestParam) {
        String username = requestParam.getUsername();
        String password = requestParam.getPassword();
        if (StrUtil.isBlank(username) || StrUtil.isBlank(password)) {
            throw new ClientException("用户名或密码不能为空");
        }
        if (isDevBypass(username, password)) {
            StpUtil.login(DEV_BYPASS_LOGIN_ID);
            return LoginVO.builder()
                    .userId(DEV_BYPASS_LOGIN_ID)
                    .username(StrUtil.trim(username))
                    .role("admin")
                    .token(StpUtil.getTokenValue())
                    .avatar(DEFAULT_AVATAR_URL)
                    .build();
        }
        userSchemaService.ensureUserColumns();
        UserDO user = findByUsername(username);
        if (user == null || !PasswordHasher.matches(password, user.getPassword())) {
            throw new ClientException("用户名或密码错误");
        }
        ensureAccountActive(user);
        if (user.getId() == null) {
            throw new ClientException("用户信息异常");
        }
        upgradePasswordIfNeeded(user, password);
        return finishLogin(user);
    }

    @Override
    public LoginVO register(RegisterRequest requestParam) {
        if (requestParam == null) {
            throw new ClientException("请求不能为空");
        }
        String username = StrUtil.trimToNull(requestParam.getUsername());
        String password = StrUtil.trimToNull(requestParam.getPassword());
        if (StrUtil.isBlank(username) || StrUtil.isBlank(password)) {
            throw new ClientException("用户名或密码不能为空");
        }
        if (!USERNAME_PATTERN.matcher(username).matches()) {
            throw new ClientException("用户名需为 3-32 位字母、数字、下划线或中文");
        }
        if (password.length() < 6 || password.length() > 64) {
            throw new ClientException("密码长度需为 6-64 位");
        }
        if ("admin".equalsIgnoreCase(username)) {
            throw new ClientException("该用户名不可用");
        }
        userSchemaService.ensureUserColumns();
        if (findByUsername(username) != null) {
            throw new ClientException("用户名已存在");
        }
        UserDO user = UserDO.builder()
                .username(username)
                .password(PasswordHasher.hash(password))
                .role("user")
                .avatar(DEFAULT_AVATAR_URL)
                .accountStatus("active")
                .freeChatRemaining(Math.max(0, authProperties.getNewUserFreeChatQuota()))
                .build();
        userMapper.insert(user);
        if (user.getId() == null) {
            throw new ClientException("注册失败：用户创建异常");
        }
        return finishLogin(user);
    }

    @Override
    public LoginVO loginWithGoogle(String idToken) {
        VerifiedGoogleUser googleUser = googleOAuthService.verifyIdToken(idToken);
        UserDO user = findOrCreateOAuthUser(
                googleUser.email(),
                StrUtil.blankToDefault(googleUser.picture(), DEFAULT_AVATAR_URL),
                googleUser.name());
        return finishLogin(user);
    }

    @Override
    public LoginVO loginWithApple(String idToken) {
        VerifiedAppleUser appleUser = appleOAuthService.verifyIdToken(idToken);
        String username = StrUtil.isNotBlank(appleUser.email())
                ? appleUser.email()
                : "apple:" + appleUser.subject();
        UserDO user = findOrCreateOAuthUser(username, DEFAULT_AVATAR_URL, null);
        return finishLogin(user);
    }

    @Override
    public LoginVO loginWithWeChat(String code) {
        VerifiedWeChatUser wx = weChatOAuthService.exchangeCode(code);
        String username = StrUtil.isNotBlank(wx.unionId())
                ? "wechat:" + wx.unionId()
                : "wechat:" + wx.openId();
        String avatar = StrUtil.blankToDefault(wx.avatar(), DEFAULT_AVATAR_URL);
        UserDO user = findOrCreateOAuthUser(username, avatar, wx.nickname());
        return finishLogin(user);
    }

    @Override
    public void logout() {
        StpUtil.logout();
    }

    private UserDO findOrCreateOAuthUser(String username, String avatar, String displayHint) {
        userSchemaService.ensureUserColumns();
        UserDO user = findByUsername(username);
        if (user == null) {
            user = UserDO.builder()
                    .username(username)
                    .password("oauth:" + UUID.randomUUID())
                    .role("user")
                    .avatar(StrUtil.blankToDefault(avatar, DEFAULT_AVATAR_URL))
                    .accountStatus("active")
                    .freeChatRemaining(Math.max(0, authProperties.getNewUserFreeChatQuota()))
                    .build();
            if (StrUtil.isNotBlank(displayHint)) {
                user.setDisplayName(displayHint);
            }
            userMapper.insert(user);
        } else {
            // 已有本地密码账号：禁止 OAuth 直接接管，避免邮箱抢注后被第三方登录劫持
            String stored = user.getPassword();
            boolean oauthOnly = StrUtil.isNotBlank(stored) && stored.startsWith("oauth:");
            if (!oauthOnly && StrUtil.isNotBlank(stored)) {
                throw new ClientException("该账号已使用密码注册，请先用密码登录");
            }
            ensureAccountActive(user);
            if (StrUtil.isNotBlank(avatar) && StrUtil.isBlank(user.getAvatar())) {
                user.setAvatar(avatar);
                userMapper.updateById(user);
            }
        }
        if (user.getId() == null) {
            throw new ClientException("登录失败：用户创建异常");
        }
        return user;
    }

    private LoginVO finishLogin(UserDO user) {
        ensureAccountActive(user);
        String loginId = user.getId().toString();
        StpUtil.login(loginId);
        String avatar = StrUtil.isBlank(user.getAvatar()) ? DEFAULT_AVATAR_URL : user.getAvatar();
        return LoginVO.builder()
                .userId(loginId)
                .username(user.getUsername())
                .role(user.getRole())
                .token(StpUtil.getTokenValue())
                .avatar(avatar)
                .build();
    }

    private void ensureAccountActive(UserDO user) {
        String status = StrUtil.blankToDefault(user.getAccountStatus(), "active");
        if ("banned".equalsIgnoreCase(status)) {
            throw new ClientException("账号已被封禁，无法登录");
        }
        if ("restricted".equalsIgnoreCase(status)) {
            throw new ClientException("账号已被限制登录，请联系站长");
        }
    }

    private void upgradePasswordIfNeeded(UserDO user, String rawPassword) {
        if (!PasswordHasher.needsUpgrade(user.getPassword())) {
            return;
        }
        user.setPassword(PasswordHasher.hash(rawPassword));
        userMapper.updateById(user);
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
