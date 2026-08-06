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

package com.nageoffer.ai.ragent.jobintel.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * 启动时幂等补齐岗位情报表。
 * 兼容历史问题：upgrade_v1.4_to_v1.5 曾因错误探针被登记，但表实际未创建。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JobIntelSchemaService {

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
                    CREATE TABLE IF NOT EXISTS t_job_intel_contribution (
                        id              VARCHAR(64) PRIMARY KEY,
                        job_id          VARCHAR(64),
                        submitter_id    VARCHAR(64) NOT NULL,
                        state_code      VARCHAR(8),
                        job_title       VARCHAR(255),
                        hourly_wage     NUMERIC(10, 2),
                        notes           TEXT NOT NULL,
                        status          VARCHAR(32) NOT NULL DEFAULT 'pending',
                        admin_summary   TEXT,
                        published       SMALLINT NOT NULL DEFAULT 0,
                        create_time     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        update_time     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        deleted         SMALLINT NOT NULL DEFAULT 0
                    )
                    """);
            jdbcTemplate.execute(
                    "CREATE INDEX IF NOT EXISTS idx_job_intel_contrib_status ON t_job_intel_contribution (status, deleted)"
            );
            jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS t_job_intel_document (
                        id              VARCHAR(64) PRIMARY KEY,
                        job_id          VARCHAR(64) NOT NULL,
                        kind            VARCHAR(32) NOT NULL,
                        title           VARCHAR(255),
                        body            TEXT NOT NULL,
                        uploader_id     VARCHAR(64) NOT NULL,
                        status          VARCHAR(32) NOT NULL DEFAULT 'pending',
                        create_time     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        update_time     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        deleted         SMALLINT NOT NULL DEFAULT 0
                    )
                    """);
            jdbcTemplate.execute(
                    "CREATE INDEX IF NOT EXISTS idx_job_intel_doc_job ON t_job_intel_document (job_id, status, deleted)"
            );
            jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS t_doc_poll_vote (
                        id              VARCHAR(64) PRIMARY KEY,
                        poll_id         VARCHAR(64) NOT NULL,
                        user_id         VARCHAR(64) NOT NULL,
                        option_id       VARCHAR(64) NOT NULL,
                        work_state      VARCHAR(8),
                        program_year    VARCHAR(8),
                        voted_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE (poll_id, user_id)
                    )
                    """);
            ensured = true;
            log.info("已确保岗位情报相关表就绪（t_job_intel_contribution / t_job_intel_document）");
        }
    }
}
