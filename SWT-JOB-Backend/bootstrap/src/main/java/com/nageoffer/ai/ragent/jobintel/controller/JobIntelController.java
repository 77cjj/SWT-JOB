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

package com.nageoffer.ai.ragent.jobintel.controller;

import cn.dev33.satoken.stp.StpUtil;
import com.nageoffer.ai.ragent.framework.context.UserContext;
import com.nageoffer.ai.ragent.framework.convention.Result;
import com.nageoffer.ai.ragent.framework.web.Results;
import com.nageoffer.ai.ragent.jobintel.controller.request.JobIntelContributionReviewRequest;
import com.nageoffer.ai.ragent.jobintel.controller.request.JobIntelContributionSubmitRequest;
import com.nageoffer.ai.ragent.jobintel.controller.request.JobIntelDocumentReviewRequest;
import com.nageoffer.ai.ragent.jobintel.controller.request.JobIntelDocumentSubmitRequest;
import com.nageoffer.ai.ragent.jobintel.controller.vo.JobIntelContributionVO;
import com.nageoffer.ai.ragent.jobintel.controller.vo.JobIntelDocumentVO;
import com.nageoffer.ai.ragent.jobintel.service.JobIntelService;
import lombok.RequiredArgsConstructor;
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
public class JobIntelController {

    private final JobIntelService jobIntelService;

    @PostMapping("/job-intel/contributions")
    public Result<String> submitContribution(@RequestBody JobIntelContributionSubmitRequest body) {
        String id = jobIntelService.submitContribution(UserContext.requireUser().getUserId(), body);
        return Results.success(id);
    }

    @GetMapping("/job-intel/contributions")
    public Result<List<JobIntelContributionVO>> listContributionsAdmin(
            @RequestParam(required = false) String status) {
        StpUtil.checkRole("admin");
        return Results.success(jobIntelService.listContributionsAdmin(status));
    }

    @PutMapping("/job-intel/contributions/{id}")
    public Result<Void> reviewContribution(@PathVariable String id, @RequestBody JobIntelContributionReviewRequest body) {
        StpUtil.checkRole("admin");
        jobIntelService.reviewContribution(id, body);
        return Results.success();
    }

    @GetMapping("/public/job-intel/jobs/{jobId}/documents")
    public Result<List<JobIntelDocumentVO>> listPublicDocuments(@PathVariable String jobId) {
        return Results.success(jobIntelService.listDocumentsPublic(jobId));
    }

    @PostMapping("/job-intel/jobs/{jobId}/documents")
    public Result<String> submitDocument(@PathVariable String jobId, @RequestBody JobIntelDocumentSubmitRequest body) {
        String id = jobIntelService.submitDocument(UserContext.requireUser().getUserId(), jobId, body);
        return Results.success(id);
    }

    @GetMapping("/job-intel/documents")
    public Result<List<JobIntelDocumentVO>> listDocumentsAdmin(@RequestParam(required = false) String status) {
        StpUtil.checkRole("admin");
        return Results.success(jobIntelService.listDocumentsAdmin(status));
    }

    @PutMapping("/job-intel/documents/{id}")
    public Result<Void> reviewDocument(@PathVariable String id, @RequestBody JobIntelDocumentReviewRequest body) {
        StpUtil.checkRole("admin");
        jobIntelService.reviewDocument(id, body);
        return Results.success();
    }
}
