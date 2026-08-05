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

import com.nageoffer.ai.ragent.deals.service.ReferralDealKnowledgeSyncService;
import com.nageoffer.ai.ragent.deals.service.ReferralDealSeedService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReferralDealKnowledgeBootstrap implements ApplicationRunner {

    private final ReferralDealProperties properties;
    private final ReferralDealSeedService seedService;
    private final ReferralDealKnowledgeSyncService syncService;

    @Override
    public void run(ApplicationArguments args) {
        if (properties.isAutoSeedMissing()) {
            int seeded = seedService.seedMissingFromClasspath();
            if (seeded > 0) {
                log.info("启动时补缺 {} 个薅羊毛项目到数据库", seeded);
            }
        }
        if (!properties.isSyncEnabled() || !properties.isSyncOnStartup()) {
            return;
        }
        log.info("启动后异步同步薅羊毛知识库…");
        syncService.syncAsync();
    }
}
