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

package com.nageoffer.ai.ragent.sitefeature.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class SiteFeatureSchemaService {

    private final JdbcTemplate jdbcTemplate;

    private volatile boolean ensured;

    public void ensureSchema() {
        if (ensured) {
            return;
        }
        synchronized (this) {
            if (ensured) {
                return;
            }
            jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS t_site_feature_flag (
                        feature_key     VARCHAR(64) PRIMARY KEY,
                        enabled         SMALLINT NOT NULL DEFAULT 1,
                        label_zh        VARCHAR(128),
                        sort_order      INT NOT NULL DEFAULT 0,
                        update_time     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    )
                    """);
            seedDefaults();
            ensured = true;
            log.info("已确保站点功能开关表就绪（t_site_feature_flag）");
        }
    }

    /** 幂等写入默认五菜单开关（岗位情报 / SWT文档默认关闭） */
    public void seedDefaults() {
        jdbcTemplate.execute("""
                INSERT INTO t_site_feature_flag (feature_key, enabled, label_zh, sort_order) VALUES
                    ('chat', 1, 'AI问答', 10),
                    ('deals', 1, '薅羊毛', 20),
                    ('compare', 1, '选岗计算器', 30),
                    ('jobs', 0, '岗位情报', 40),
                    ('docs', 0, 'SWT文档', 50)
                ON CONFLICT (feature_key) DO NOTHING
                """);
    }
}
