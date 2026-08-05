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

package com.nageoffer.ai.ragent.deals.config;

import com.nageoffer.ai.ragent.deals.service.ReferralDealSchemaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * 启动时确保薅羊毛表具备 AI 开关字段（避免仅部署 jar 未跑 upgrade SQL）
 */
@Slf4j
@Component
@Order(10)
@RequiredArgsConstructor
public class ReferralDealSchemaMigrator implements ApplicationRunner {

    private final ReferralDealSchemaService schemaService;

    @Override
    public void run(ApplicationArguments args) {
        try {
            schemaService.ensureAiEnabledColumn();
        } catch (Exception ex) {
            log.error("自动补齐 t_referral_deal.ai_enabled 失败，请手动执行 upgrade_v1.6_to_v1.7.sql", ex);
        }
    }
}
