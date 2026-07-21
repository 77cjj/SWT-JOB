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

package com.nageoffer.ai.ragent.docpoll.controller;

import cn.hutool.core.lang.Assert;
import com.nageoffer.ai.ragent.docpoll.controller.request.DocPollVoteRequest;
import com.nageoffer.ai.ragent.docpoll.service.DocPollService;
import com.nageoffer.ai.ragent.framework.context.LoginUser;
import com.nageoffer.ai.ragent.framework.context.UserContext;
import com.nageoffer.ai.ragent.framework.convention.Result;
import com.nageoffer.ai.ragent.framework.exception.ClientException;
import com.nageoffer.ai.ragent.framework.web.Results;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class DocPollController {

    private final DocPollService docPollService;

    @GetMapping("/public/doc-polls/{pollId}")
    public Result<Map<String, Object>> getPoll(@PathVariable String pollId) {
        if (!docPollService.isKnownPoll(pollId)) {
            throw new ClientException("Poll not found");
        }
        Map<String, Integer> counts = docPollService.countByOption(pollId);
        int total = counts.values().stream().mapToInt(Integer::intValue).sum();

        String myVote = null;
        LoginUser user = UserContext.get();
        if (user != null) {
            myVote = docPollService.findUserVote(pollId, user.getUserId());
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("pollId", pollId);
        payload.put("counts", counts);
        payload.put("total", total);
        payload.put("myVote", myVote);
        return Results.success(payload);
    }

    @PostMapping("/doc-polls/{pollId}/vote")
    public Result<Map<String, Object>> vote(@PathVariable String pollId, @RequestBody DocPollVoteRequest body) {
        LoginUser user = UserContext.requireUser();
        String optionId = body.getOptionId() == null ? null : body.getOptionId().trim();
        String workState = body.getWorkState() == null ? null : body.getWorkState().trim().toUpperCase();
        String programYear = body.getProgramYear() == null ? null : body.getProgramYear().trim();
        Assert.notBlank(optionId, () -> new ClientException("Invalid option"));
        Assert.isTrue(workState != null && workState.length() == 2, () -> new ClientException("Work state required"));
        Assert.isTrue(programYear != null && programYear.matches("\\d{4}"), () -> new ClientException("Program year required"));

        docPollService.vote(pollId, user.getUserId(), optionId, workState, programYear);
        return getPoll(pollId);
    }
}
