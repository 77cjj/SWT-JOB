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

package com.nageoffer.ai.ragent.dealcomment.controller;

import cn.dev33.satoken.stp.StpUtil;
import com.nageoffer.ai.ragent.dealcomment.controller.request.DealCommentAdminUpdateRequest;
import com.nageoffer.ai.ragent.dealcomment.controller.request.DealCommentSubmitRequest;
import com.nageoffer.ai.ragent.dealcomment.controller.vo.DealCommentVO;
import com.nageoffer.ai.ragent.dealcomment.service.DealCommentService;
import com.nageoffer.ai.ragent.framework.context.UserContext;
import com.nageoffer.ai.ragent.framework.convention.Result;
import com.nageoffer.ai.ragent.framework.web.Results;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class DealCommentController {

    private final DealCommentService dealCommentService;

    @GetMapping("/public/deal-comments")
    public Result<List<DealCommentVO>> listPublic(@RequestParam String dealId) {
        return Results.success(dealCommentService.listPublic(dealId));
    }

    @PostMapping("/deal-comments")
    public Result<String> submit(@RequestBody DealCommentSubmitRequest body) {
        String id = dealCommentService.submit(UserContext.requireUser().getUserId(), body);
        return Results.success(id);
    }

    @GetMapping("/admin/deal-comments")
    public Result<List<DealCommentVO>> listAdmin(@RequestParam(required = false) String dealId) {
        StpUtil.checkRole("admin");
        return Results.success(dealCommentService.listAdmin(dealId));
    }

    @PutMapping("/admin/deal-comments/{id}")
    public Result<Void> adminUpdate(@PathVariable String id, @RequestBody DealCommentAdminUpdateRequest body) {
        StpUtil.checkRole("admin");
        dealCommentService.adminUpdate(id, body);
        return Results.success();
    }

    @DeleteMapping("/admin/deal-comments/{id}")
    public Result<Void> adminDelete(@PathVariable String id) {
        StpUtil.checkRole("admin");
        dealCommentService.adminDelete(id);
        return Results.success();
    }
}
