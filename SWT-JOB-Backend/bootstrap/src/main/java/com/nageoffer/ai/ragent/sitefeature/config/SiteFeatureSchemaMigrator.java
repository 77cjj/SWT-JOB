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

package com.nageoffer.ai.ragent.sitefeature.config;

import com.nageoffer.ai.ragent.sitefeature.service.SiteFeatureSchemaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Order(13)
@RequiredArgsConstructor
public class SiteFeatureSchemaMigrator implements ApplicationRunner {

    private final SiteFeatureSchemaService schemaService;

    @Override
    public void run(ApplicationArguments args) {
        try {
            schemaService.ensureSchema();
        } catch (Exception ex) {
            log.error("自动补齐 t_site_feature_flag 失败，请执行 ./server.sh db up", ex);
        }
    }
}
