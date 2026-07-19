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
 * 密码哈希与兼容明文迁移期校验。
 */
public final class PasswordHasher {

    private PasswordHasher() {
    }

    public static String hash(String rawPassword) {
        return BCrypt.hashpw(rawPassword);
    }

    public static boolean matches(String rawPassword, String stored) {
        if (StrUtil.isBlank(stored)) {
            return StrUtil.isBlank(rawPassword);
        }
        if (isBcryptHash(stored)) {
            try {
                return BCrypt.checkpw(rawPassword, stored);
            } catch (Exception ex) {
                return false;
            }
        }
        // 迁移期：历史明文密码仍可登录，登录成功后应重写为哈希
        return stored.equals(rawPassword);
    }

    public static boolean isBcryptHash(String stored) {
        return StrUtil.isNotBlank(stored)
                && (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$"));
    }

    public static boolean needsRehash(String stored) {
        return !isBcryptHash(stored);
    }
}
