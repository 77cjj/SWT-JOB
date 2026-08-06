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

package com.nageoffer.ai.ragent.deals.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReferralDealSchemaService {

    private final JdbcTemplate jdbcTemplate;

    private volatile boolean ensured;

    /** 兼容旧调用名 */
    public void ensureAiEnabledColumn() {
        ensureSchema();
    }

    /** 确保表 + ai_enabled 字段存在（幂等） */
    public void ensureSchema() {
        if (ensured) {
            return;
        }
        synchronized (this) {
            if (ensured) {
                return;
            }
            jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS t_referral_deal (
                        id                  VARCHAR(64) PRIMARY KEY,
                        site_rebate_usd     DECIMAL(10, 2),
                        site_rebate_label_zh VARCHAR(255),
                        site_rebate_label_en VARCHAR(255),
                        program_json        TEXT NOT NULL,
                        sort_order          INT DEFAULT 0,
                        published           SMALLINT DEFAULT 1,
                        ai_enabled          SMALLINT DEFAULT 1,
                        create_time         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        update_time         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        deleted             SMALLINT DEFAULT 0
                    )
                    """);
            jdbcTemplate.execute(
                    "ALTER TABLE t_referral_deal ADD COLUMN IF NOT EXISTS ai_enabled SMALLINT DEFAULT 1"
            );
            jdbcTemplate.execute(
                    "CREATE INDEX IF NOT EXISTS idx_referral_deal_published ON t_referral_deal (published, deleted)"
            );
            jdbcTemplate.execute(
                    "CREATE INDEX IF NOT EXISTS idx_referral_deal_ai_enabled ON t_referral_deal (ai_enabled, published, deleted)"
            );
            jdbcTemplate.execute(
                    "UPDATE t_referral_deal SET ai_enabled = 1 WHERE ai_enabled IS NULL"
            );
            ensured = true;
            log.info("已确保 t_referral_deal 表与 ai_enabled 字段就绪");
        }
    }
}
