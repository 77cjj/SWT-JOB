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

package com.nageoffer.ai.ragent.user.util;

import cn.hutool.core.util.StrUtil;
import cn.hutool.crypto.digest.BCrypt;

/**
 * 密码哈希：新密码使用 BCrypt；兼容历史明文，校验成功后由调用方升级。
 */
public final class PasswordHasher {

    private PasswordHasher() {
    }

    public static String hash(String rawPassword) {
        return BCrypt.hashpw(rawPassword);
    }

    public static boolean isHashed(String stored) {
        if (StrUtil.isBlank(stored)) {
            return false;
        }
        return stored.startsWith("$2a$")
                || stored.startsWith("$2b$")
                || stored.startsWith("$2y$");
    }

    public static boolean matches(String rawPassword, String stored) {
        if (StrUtil.isBlank(rawPassword) || StrUtil.isBlank(stored)) {
            return false;
        }
        if (isHashed(stored)) {
            return BCrypt.checkpw(rawPassword, stored);
        }
        // OAuth 占位密码不可用于账密登录
        if (stored.startsWith("oauth:")) {
            return false;
        }
        // 历史明文兼容
        return stored.equals(rawPassword);
    }

    public static boolean needsUpgrade(String stored) {
        return StrUtil.isNotBlank(stored) && !isHashed(stored) && !stored.startsWith("oauth:");
    }
}
