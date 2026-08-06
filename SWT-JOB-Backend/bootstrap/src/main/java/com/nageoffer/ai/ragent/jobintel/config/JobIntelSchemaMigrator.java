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

package com.nageoffer.ai.ragent.jobintel.config;

import com.nageoffer.ai.ragent.jobintel.service.JobIntelSchemaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * 启动时确保岗位情报表存在（避免仅部署 jar / 迁移误登记导致后台审核报「表缺失」）。
 */
@Slf4j
@Component
@Order(11)
@RequiredArgsConstructor
public class JobIntelSchemaMigrator implements ApplicationRunner {

    private final JobIntelSchemaService schemaService;

    @Override
    public void run(ApplicationArguments args) {
        try {
            schemaService.ensureSchema();
        } catch (Exception ex) {
            log.error("自动补齐岗位情报表失败，请手动执行 upgrade_v1.4_to_v1.5.sql 或 ./server.sh db up", ex);
        }
    }
}
