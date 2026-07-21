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

package com.nageoffer.ai.ragent.docpoll.service;

import cn.hutool.core.lang.Assert;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.nageoffer.ai.ragent.docpoll.dao.entity.DocPollVoteDO;
import com.nageoffer.ai.ragent.docpoll.dao.mapper.DocPollVoteMapper;
import com.nageoffer.ai.ragent.framework.exception.ClientException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class DocPollService {

    private static final Map<String, Set<String>> POLL_OPTIONS = Map.of(
            "second-job", Set.of("yes", "searching", "not-allowed", "not-needed"),
            "bank-account", Set.of("before-ssn", "after-ssn", "itin", "not-yet")
    );

    private final DocPollVoteMapper docPollVoteMapper;

    public boolean isKnownPoll(String pollId) {
        return POLL_OPTIONS.containsKey(pollId);
    }

    public Set<String> optionIds(String pollId) {
        return POLL_OPTIONS.getOrDefault(pollId, Set.of());
    }

    public Map<String, Integer> countByOption(String pollId) {
        List<DocPollVoteDO> votes = docPollVoteMapper.selectList(
                Wrappers.lambdaQuery(DocPollVoteDO.class).eq(DocPollVoteDO::getPollId, pollId)
        );
        Map<String, Integer> counts = new HashMap<>();
        for (String optionId : optionIds(pollId)) {
            counts.put(optionId, 0);
        }
        for (DocPollVoteDO vote : votes) {
            counts.merge(vote.getOptionId(), 1, Integer::sum);
        }
        return counts;
    }

    public String findUserVote(String pollId, String userId) {
        DocPollVoteDO row = docPollVoteMapper.selectOne(
                Wrappers.lambdaQuery(DocPollVoteDO.class)
                        .eq(DocPollVoteDO::getPollId, pollId)
                        .eq(DocPollVoteDO::getUserId, userId)
                        .last("LIMIT 1")
        );
        return row == null ? null : row.getOptionId();
    }

    @Transactional
    public void vote(String pollId, String userId, String optionId, String workState, String programYear) {
        Assert.isTrue(isKnownPoll(pollId), () -> new ClientException("Poll not found"));
        Assert.isTrue(optionIds(pollId).contains(optionId), () -> new ClientException("Invalid option"));

        DocPollVoteDO existing = docPollVoteMapper.selectOne(
                Wrappers.lambdaQuery(DocPollVoteDO.class)
                        .eq(DocPollVoteDO::getPollId, pollId)
                        .eq(DocPollVoteDO::getUserId, userId)
                        .last("LIMIT 1")
        );
        if (existing == null) {
            docPollVoteMapper.insert(DocPollVoteDO.builder()
                    .pollId(pollId)
                    .userId(userId)
                    .optionId(optionId)
                    .workState(workState)
                    .programYear(programYear)
                    .votedAt(new Date())
                    .build());
        } else {
            existing.setOptionId(optionId);
            existing.setWorkState(workState);
            existing.setProgramYear(programYear);
            existing.setVotedAt(new Date());
            docPollVoteMapper.updateById(existing);
        }
    }
}
