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

package com.nageoffer.ai.ragent.compare.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class CompareJobSchemaService {

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
                    CREATE TABLE IF NOT EXISTS t_compare_job_entry (
                        id                  VARCHAR(64) PRIMARY KEY,
                        client_job_id       VARCHAR(64),
                        user_id             VARCHAR(64),
                        job_title           VARCHAR(255) NOT NULL,
                        company             VARCHAR(255),
                        state_code          VARCHAR(8) NOT NULL,
                        hourly_wage         NUMERIC(10, 2) NOT NULL,
                        avg_hours_per_week  NUMERIC(8, 2),
                        tipped              SMALLINT NOT NULL DEFAULT 0,
                        average_tip         NUMERIC(10, 2),
                        has_housing         SMALLINT NOT NULL DEFAULT 0,
                        housing_cost_per_week NUMERIC(10, 2),
                        second_job_hours    NUMERIC(8, 2),
                        second_job_hourly_wage NUMERIC(10, 2),
                        project_start_date  DATE,
                        project_end_date    DATE,
                        payload_json        TEXT NOT NULL,
                        source              VARCHAR(32) NOT NULL DEFAULT 'compare_form',
                        create_time         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        update_time         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        deleted             SMALLINT NOT NULL DEFAULT 0
                    )
                    """);
            jdbcTemplate.execute(
                    "CREATE INDEX IF NOT EXISTS idx_compare_job_user ON t_compare_job_entry (user_id, deleted, create_time DESC)"
            );
            jdbcTemplate.execute(
                    "CREATE INDEX IF NOT EXISTS idx_compare_job_state ON t_compare_job_entry (state_code, deleted)"
            );
            ensured = true;
            log.info("已确保选岗计算器表就绪（t_compare_job_entry）");
        }
    }
}
