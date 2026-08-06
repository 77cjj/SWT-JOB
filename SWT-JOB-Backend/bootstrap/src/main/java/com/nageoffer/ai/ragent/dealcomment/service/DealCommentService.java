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

package com.nageoffer.ai.ragent.dealcomment.service;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.nageoffer.ai.ragent.dealcomment.controller.request.DealCommentAdminUpdateRequest;
import com.nageoffer.ai.ragent.dealcomment.controller.request.DealCommentSubmitRequest;
import com.nageoffer.ai.ragent.dealcomment.controller.vo.DealCommentVO;
import com.nageoffer.ai.ragent.dealcomment.dao.entity.DealCommentDO;
import com.nageoffer.ai.ragent.dealcomment.dao.mapper.DealCommentMapper;
import com.nageoffer.ai.ragent.framework.exception.ClientException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class DealCommentService {

    private static final Pattern DANGEROUS = Pattern.compile("[;<>`]|--|/\\*|\\*/");

    private final DealCommentMapper mapper;
    private final DealCommentSchemaService schemaService;

    public List<DealCommentVO> listPublic(String dealId) {
        schemaService.ensureSchema();
        String id = requireDealId(dealId);
        return mapper.selectList(
                Wrappers.lambdaQuery(DealCommentDO.class)
                        .eq(DealCommentDO::getDealId, id)
                        .eq(DealCommentDO::getStatus, "visible")
                        .orderByDesc(DealCommentDO::getCreateTime)
                        .last("LIMIT 200")
        ).stream().map(this::toVo).toList();
    }

    public List<DealCommentVO> listAdmin(String dealId) {
        schemaService.ensureSchema();
        var q = Wrappers.lambdaQuery(DealCommentDO.class)
                .orderByDesc(DealCommentDO::getCreateTime)
                .last("LIMIT 500");
        if (StrUtil.isNotBlank(dealId)) {
            q.eq(DealCommentDO::getDealId, dealId.trim());
        }
        return mapper.selectList(q).stream().map(this::toVo).toList();
    }

    @Transactional
    public String submit(String userId, DealCommentSubmitRequest req) {
        schemaService.ensureSchema();
        if (req == null) {
            throw new ClientException("请求体不能为空");
        }
        String dealId = requireDealId(req.getDealId());
        String body = sanitizeBody(req.getBody());
        String parentId = StrUtil.trimToNull(req.getParentId());
        if (parentId != null) {
            parentId = parentId.replaceAll("[^A-Za-z0-9_\\-]", "");
            if (parentId.isBlank()) {
                parentId = null;
            }
        }

        DealCommentDO row = DealCommentDO.builder()
                .dealId(dealId)
                .userId(userId)
                .parentId(parentId)
                .body(body)
                .status("visible")
                .helpfulCount(0)
                .dislikeCount(0)
                .build();
        mapper.insert(row);
        return row.getId();
    }

    @Transactional
    public void adminUpdate(String id, DealCommentAdminUpdateRequest req) {
        schemaService.ensureSchema();
        DealCommentDO row = mapper.selectById(id);
        if (row == null) {
            throw new ClientException("评论不存在");
        }
        if (req == null) {
            throw new ClientException("请求体不能为空");
        }
        if (req.getStatus() != null) {
            String status = req.getStatus().trim();
            if (!"visible".equals(status) && !"hidden".equals(status)) {
                throw new ClientException("状态无效");
            }
            row.setStatus(status);
        }
        if (req.getBody() != null) {
            row.setBody(sanitizeBody(req.getBody()));
        }
        mapper.updateById(row);
    }

    @Transactional
    public void adminDelete(String id) {
        schemaService.ensureSchema();
        DealCommentDO row = mapper.selectById(id);
        if (row == null) {
            throw new ClientException("评论不存在");
        }
        mapper.deleteById(id);
    }

    private static String requireDealId(String dealId) {
        String id = StrUtil.trimToEmpty(dealId).toLowerCase().replaceAll("[^a-z0-9_\\-]", "");
        if (id.isBlank() || id.length() > 64) {
            throw new ClientException("项目 ID 无效");
        }
        return id;
    }

    private static String sanitizeBody(String raw) {
        String body = StrUtil.trimToEmpty(raw);
        if (body.length() < 2) {
            throw new ClientException("评论至少 2 个字");
        }
        if (body.length() > 2000) {
            body = body.substring(0, 2000);
        }
        if (DANGEROUS.matcher(body).find()) {
            throw new ClientException("评论包含非法字符");
        }
        body = body.replaceAll("[\\p{Cntrl}]", "");
        if (body.isBlank()) {
            throw new ClientException("评论无效");
        }
        return body;
    }

    private DealCommentVO toVo(DealCommentDO row) {
        return DealCommentVO.builder()
                .id(row.getId())
                .dealId(row.getDealId())
                .userId(row.getUserId())
                .parentId(row.getParentId())
                .body(row.getBody())
                .status(row.getStatus())
                .helpfulCount(row.getHelpfulCount())
                .dislikeCount(row.getDislikeCount())
                .createTime(row.getCreateTime())
                .updateTime(row.getUpdateTime())
                .build();
    }
}
