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

package com.nageoffer.ai.ragent.user.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * 启动/登录前补齐 t_user 新增字段，避免仅部署新 jar 未跑 upgrade SQL 导致登录失败。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserSchemaService {

    private final JdbcTemplate jdbcTemplate;

    private volatile boolean ensured;

    public void ensureUserColumns() {
        if (ensured) {
            return;
        }
        synchronized (this) {
            if (ensured) {
                return;
            }
            // upgrade_v1.4_to_v1.5
            jdbcTemplate.execute(
                    "ALTER TABLE t_user ADD COLUMN IF NOT EXISTS official_verified SMALLINT NOT NULL DEFAULT 0"
            );
            jdbcTemplate.execute(
                    "ALTER TABLE t_user ADD COLUMN IF NOT EXISTS account_status VARCHAR(32) NOT NULL DEFAULT 'active'"
            );
            jdbcTemplate.execute(
                    "ALTER TABLE t_user ADD COLUMN IF NOT EXISTS restriction_note TEXT"
            );
            jdbcTemplate.execute(
                    "ALTER TABLE t_user ADD COLUMN IF NOT EXISTS display_name VARCHAR(128)"
            );
            // upgrade_v1.5_to_v1.6
            jdbcTemplate.execute(
                    "ALTER TABLE t_user ADD COLUMN IF NOT EXISTS free_chat_remaining INT"
            );
            ensured = true;
            log.info("已确保 t_user 扩展字段就绪（official_verified/account_status/free_chat_remaining 等）");
        }
    }
}
