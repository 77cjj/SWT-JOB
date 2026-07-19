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

package com.nageoffer.ai.ragent.publicapi.controller;

import com.nageoffer.ai.ragent.deal.controller.vo.DealExperienceVO;
import com.nageoffer.ai.ragent.deal.service.DealExperienceService;
import com.nageoffer.ai.ragent.framework.convention.Result;
import com.nageoffer.ai.ragent.framework.web.Results;
import com.nageoffer.ai.ragent.user.controller.vo.UserProfileVO;
import com.nageoffer.ai.ragent.user.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class PublicCommunityController {

    private final DealExperienceService dealExperienceService;
    private final UserProfileService userProfileService;

    @GetMapping("/public/deal-experiences")
    public Result<List<DealExperienceVO>> listDealExperiences(
            @RequestParam String programId,
            @RequestParam(required = false) String editionId) {
        return Results.success(dealExperienceService.listByProgram(programId, editionId));
    }

    @GetMapping("/public/deal-experiences/by-user/{userId}")
    public Result<List<DealExperienceVO>> listDealExperiencesByUser(@PathVariable String userId) {
        return Results.success(dealExperienceService.listByUser(userId));
    }

    @GetMapping("/public/user-profiles/{userId}")
    public Result<UserProfileVO> publicProfile(@PathVariable String userId) {
        return Results.success(userProfileService.getProfileForViewer(userId, null));
    }
}
