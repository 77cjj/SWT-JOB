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

package com.nageoffer.ai.ragent.sitefeature.controller;

import cn.dev33.satoken.stp.StpUtil;
import com.nageoffer.ai.ragent.framework.convention.Result;
import com.nageoffer.ai.ragent.framework.web.Results;
import com.nageoffer.ai.ragent.sitefeature.controller.request.SiteFeatureUpdateRequest;
import com.nageoffer.ai.ragent.sitefeature.controller.vo.SiteFeatureFlagVO;
import com.nageoffer.ai.ragent.sitefeature.service.SiteFeatureService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class SiteFeatureController {

    private final SiteFeatureService siteFeatureService;

    @GetMapping("/public/site-features")
    public Result<Map<String, Boolean>> publicFlags() {
        return Results.success(siteFeatureService.publicMap());
    }

    @GetMapping("/admin/site-features")
    public Result<List<SiteFeatureFlagVO>> adminList() {
        StpUtil.checkRole("admin");
        return Results.success(siteFeatureService.listFlags());
    }

    @PutMapping("/admin/site-features")
    public Result<List<SiteFeatureFlagVO>> adminUpdate(@RequestBody SiteFeatureUpdateRequest body) {
        StpUtil.checkRole("admin");
        return Results.success(siteFeatureService.updateFlags(body == null ? null : body.getFlags()));
    }
}
