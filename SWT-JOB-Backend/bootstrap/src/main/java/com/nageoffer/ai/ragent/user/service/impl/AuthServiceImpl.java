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
import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.http.HttpUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.nageoffer.ai.ragent.user.controller.request.GoogleLoginRequest;
import com.nageoffer.ai.ragent.user.controller.request.LoginRequest;
import com.nageoffer.ai.ragent.user.controller.vo.LoginVO;
import com.nageoffer.ai.ragent.user.dao.entity.UserDO;
import com.nageoffer.ai.ragent.user.dao.mapper.UserMapper;
import com.nageoffer.ai.ragent.framework.exception.ClientException;
import com.nageoffer.ai.ragent.user.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final String DEFAULT_AVATAR_URL = "https://avatars.githubusercontent.com/u/583231?v=4";
    private static final String DEV_BYPASS_USERNAME = "Admin";
    private static final String DEV_BYPASS_PASSWORD = "Admin";
    private static final String DEV_BYPASS_LOGIN_ID = "dev-admin";
    private static final String GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token=";

    private final UserMapper userMapper;

    @Value("${google.client-id:}")
    private String googleClientId;

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
    public LoginVO loginWithGoogle(GoogleLoginRequest requestParam) {
        if (StrUtil.isBlank(googleClientId)) {
            throw new ClientException("Google 登录未配置，请在服务器 .env 中设置 GOOGLE_CLIENT_ID");
        }
        if (requestParam == null || StrUtil.isBlank(requestParam.getIdToken())) {
            throw new ClientException("缺少 Google ID Token");
        }
        JSONObject payload = verifyGoogleIdToken(requestParam.getIdToken().trim());
        String sub = payload.getStr("sub");
        String email = payload.getStr("email");
        String picture = payload.getStr("picture");
        if (StrUtil.isBlank(sub)) {
            throw new ClientException("无法解析 Google 账号信息");
        }

        UserDO user = userMapper.selectOne(
                Wrappers.lambdaQuery(UserDO.class)
                        .eq(UserDO::getGoogleSub, sub)
                        .eq(UserDO::getDeleted, 0)
        );
        if (user == null && StrUtil.isNotBlank(email)) {
            user = findByUsername(email.trim());
            if (user != null && StrUtil.isBlank(user.getGoogleSub())) {
                user.setGoogleSub(sub);
                if (StrUtil.isNotBlank(picture)) {
                    user.setAvatar(picture);
                }
                userMapper.updateById(user);
            } else if (user != null && !sub.equals(user.getGoogleSub())) {
                user = null;
            }
        }
        if (user == null) {
            String username = resolveGoogleUsername(email, sub);
            user = UserDO.builder()
                    .username(username)
                    .password(IdUtil.fastSimpleUUID())
                    .role("user")
                    .avatar(StrUtil.isBlank(picture) ? DEFAULT_AVATAR_URL : picture)
                    .googleSub(sub)
                    .build();
            userMapper.insert(user);
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

    private JSONObject verifyGoogleIdToken(String idToken) {
        String body;
        try {
            body = HttpUtil.get(GOOGLE_TOKENINFO_URL + idToken, 8000);
        } catch (Exception ex) {
            throw new ClientException("Google Token 验证失败，请稍后重试");
        }
        if (StrUtil.isBlank(body) || !JSONUtil.isTypeJSON(body)) {
            throw new ClientException("Google Token 验证失败");
        }
        JSONObject payload = JSONUtil.parseObj(body);
        if (payload.containsKey("error") || payload.containsKey("error_description")) {
            throw new ClientException("Google Token 无效或已过期");
        }
        String aud = payload.getStr("aud");
        if (!googleClientId.equals(aud)) {
            throw new ClientException("Google Client ID 与 Token 不匹配");
        }
        String emailVerified = payload.getStr("email_verified");
        if (StrUtil.isNotBlank(emailVerified) && !"true".equalsIgnoreCase(emailVerified)) {
            throw new ClientException("Google 邮箱尚未验证");
        }
        return payload;
    }

    private String resolveGoogleUsername(String email, String sub) {
        if (StrUtil.isNotBlank(email)) {
            String candidate = email.trim();
            if (candidate.length() > 64) {
                candidate = candidate.substring(0, 64);
            }
            if (findByUsername(candidate) == null) {
                return candidate;
            }
        }
        String fallback = "g_" + sub;
        if (fallback.length() > 64) {
            fallback = fallback.substring(0, 64);
        }
        if (findByUsername(fallback) == null) {
            return fallback;
        }
        String withSuffix = "g_" + sub + "_" + IdUtil.fastSimpleUUID().substring(0, 6);
        return withSuffix.length() > 64 ? withSuffix.substring(0, 64) : withSuffix;
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
