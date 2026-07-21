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

package com.nageoffer.ai.ragent.deals.controller;

import cn.dev33.satoken.stp.StpUtil;
import com.nageoffer.ai.ragent.deals.controller.request.ReferralDealBulkUpsertRequest;
import com.nageoffer.ai.ragent.deals.controller.request.ReferralDealSaveRequest;
import com.nageoffer.ai.ragent.deals.controller.vo.ReferralDealVO;
import com.nageoffer.ai.ragent.deals.service.ReferralDealService;
import com.nageoffer.ai.ragent.framework.convention.Result;
import com.nageoffer.ai.ragent.framework.web.Results;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ReferralDealController {

    private final ReferralDealService referralDealService;

    @GetMapping("/referral-deals/public")
    public Result<List<ReferralDealVO>> listPublic() {
        return Results.success(referralDealService.listPublic());
    }

    @GetMapping("/referral-deals/public/{id}")
    public Result<ReferralDealVO> getPublic(@PathVariable String id) {
        return Results.success(referralDealService.getPublic(id));
    }

    @GetMapping("/referral-deals")
    public Result<List<ReferralDealVO>> listAdmin() {
        StpUtil.checkRole("admin");
        return Results.success(referralDealService.listAllForAdmin());
    }

    @GetMapping("/referral-deals/{id}")
    public Result<ReferralDealVO> getAdmin(@PathVariable String id) {
        StpUtil.checkRole("admin");
        return Results.success(referralDealService.getForAdmin(id));
    }

    @PostMapping("/referral-deals")
    public Result<String> create(@RequestBody ReferralDealSaveRequest request) {
        StpUtil.checkRole("admin");
        return Results.success(referralDealService.create(request));
    }

    @PutMapping("/referral-deals/{id}")
    public Result<Void> update(@PathVariable String id, @RequestBody ReferralDealSaveRequest request) {
        StpUtil.checkRole("admin");
        referralDealService.update(id, request);
        return Results.success();
    }

    @DeleteMapping("/referral-deals/{id}")
    public Result<Void> delete(@PathVariable String id) {
        StpUtil.checkRole("admin");
        referralDealService.delete(id);
        return Results.success();
    }

    @PostMapping("/referral-deals/bulk-upsert")
    public Result<Void> bulkUpsert(@RequestBody ReferralDealBulkUpsertRequest request) {
        StpUtil.checkRole("admin");
        referralDealService.bulkUpsert(request);
        return Results.success();
    }
}
