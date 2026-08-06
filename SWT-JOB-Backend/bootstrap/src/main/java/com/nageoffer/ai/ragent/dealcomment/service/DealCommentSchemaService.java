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

package com.nageoffer.ai.ragent.dealcomment.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class DealCommentSchemaService {

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
                    CREATE TABLE IF NOT EXISTS t_deal_comment (
                        id              VARCHAR(64) PRIMARY KEY,
                        deal_id         VARCHAR(64) NOT NULL,
                        user_id         VARCHAR(64) NOT NULL,
                        parent_id       VARCHAR(64),
                        body            TEXT NOT NULL,
                        status          VARCHAR(32) NOT NULL DEFAULT 'visible',
                        helpful_count   INT NOT NULL DEFAULT 0,
                        dislike_count   INT NOT NULL DEFAULT 0,
                        create_time     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        update_time     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        deleted         SMALLINT NOT NULL DEFAULT 0
                    )
                    """);
            jdbcTemplate.execute(
                    "CREATE INDEX IF NOT EXISTS idx_deal_comment_deal ON t_deal_comment (deal_id, status, deleted, create_time DESC)"
            );
            jdbcTemplate.execute(
                    "CREATE INDEX IF NOT EXISTS idx_deal_comment_parent ON t_deal_comment (parent_id, deleted)"
            );
            ensured = true;
            log.info("已确保薅羊毛评论表就绪（t_deal_comment）");
        }
    }
}
