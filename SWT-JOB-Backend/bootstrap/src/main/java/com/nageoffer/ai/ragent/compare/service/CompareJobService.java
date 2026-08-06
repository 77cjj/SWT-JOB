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

package com.nageoffer.ai.ragent.compare.service;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;
import com.nageoffer.ai.ragent.compare.controller.request.CompareJobSubmitRequest;
import com.nageoffer.ai.ragent.compare.dao.entity.CompareJobEntryDO;
import com.nageoffer.ai.ragent.compare.dao.mapper.CompareJobEntryMapper;
import com.nageoffer.ai.ragent.framework.exception.ClientException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class CompareJobService {

    private static final Pattern SAFE_TEXT = Pattern.compile("^[\\p{L}\\p{N}\\s._\\-/'&,()#+]+$");
    private static final Pattern STATE_CODE = Pattern.compile("^[A-Za-z]{2}$");
    private static final Set<String> ALLOWED_EXTRA_KEYS = Set.of(
            "overtimeRate", "workHoursRange", "overtimeAvailable", "housingDistanceKm",
            "secondJobPossible", "secondJobIndustry", "workStability", "costOfLivingIndex",
            "safetyLevel", "employerRating", "lastYearIncidents", "description", "city"
    );

    private final CompareJobEntryMapper mapper;
    private final CompareJobSchemaService schemaService;

    @Transactional
    public String submit(String userId, CompareJobSubmitRequest req) {
        schemaService.ensureSchema();
        if (req == null) {
            throw new ClientException("请求体不能为空");
        }

        String jobTitle = sanitizeText(req.getJobTitle(), 120, "岗位名称");
        if (StrUtil.isBlank(jobTitle)) {
            jobTitle = "未命名岗位";
        }
        String company = sanitizeText(req.getCompany(), 120, "公司名称");
        if (StrUtil.isBlank(company)) {
            company = "未知公司";
        }
        String state = StrUtil.trimToEmpty(req.getState()).toUpperCase(Locale.ROOT);
        if (!STATE_CODE.matcher(state).matches()) {
            throw new ClientException("州代码无效（需为两位字母）");
        }

        BigDecimal hourlyWage = requireRange(req.getHourlyWage(), "时薪", new BigDecimal("1"), new BigDecimal("200"));
        BigDecimal avgHours = optionalRange(req.getAvgHoursPerWeek(), "周工时", BigDecimal.ZERO, new BigDecimal("84"));
        boolean tipped = Boolean.TRUE.equals(req.getTipped());
        BigDecimal averageTip = tipped
                ? optionalRange(req.getAverageTip(), "小费", BigDecimal.ZERO, new BigDecimal("500"))
                : null;
        boolean hasHousing = Boolean.TRUE.equals(req.getHasHousing());
        BigDecimal housingCost = hasHousing
                ? optionalRange(req.getHousingCostPerWeek(), "周住宿费", BigDecimal.ZERO, new BigDecimal("5000"))
                : null;
        BigDecimal secondJobHours = optionalRange(req.getSecondJobHours(), "二工工时", BigDecimal.ZERO, new BigDecimal("60"));
        BigDecimal secondJobWage = optionalRange(req.getSecondJobHourlyWage(), "二工时薪", BigDecimal.ZERO, new BigDecimal("200"));
        Date start = parseDate(req.getProjectStartDate(), "项目开始日期");
        Date end = parseDate(req.getProjectEndDate(), "项目结束日期");
        if (start != null && end != null && end.before(start)) {
            throw new ClientException("项目结束日期不能早于开始日期");
        }

        String clientJobId = sanitizeId(req.getJobId(), 64);
        String source = sanitizeText(StrUtil.blankToDefault(req.getSource(), "compare_form"), 32, "来源");
        Map<String, Object> payload = buildPayload(req, jobTitle, company, state, hourlyWage, avgHours,
                tipped, averageTip, hasHousing, housingCost, secondJobHours, secondJobWage, start, end, source);

        CompareJobEntryDO row = CompareJobEntryDO.builder()
                .clientJobId(clientJobId)
                .userId(StrUtil.trimToNull(userId))
                .jobTitle(jobTitle)
                .company(company)
                .stateCode(state)
                .hourlyWage(hourlyWage)
                .avgHoursPerWeek(avgHours)
                .tipped(tipped ? 1 : 0)
                .averageTip(averageTip)
                .hasHousing(hasHousing ? 1 : 0)
                .housingCostPerWeek(housingCost)
                .secondJobHours(secondJobHours)
                .secondJobHourlyWage(secondJobWage)
                .projectStartDate(start)
                .projectEndDate(end)
                .payloadJson(JSONUtil.toJsonStr(payload))
                .source(source)
                .build();
        mapper.insert(row);
        return row.getId();
    }

    private Map<String, Object> buildPayload(
            CompareJobSubmitRequest req,
            String jobTitle,
            String company,
            String state,
            BigDecimal hourlyWage,
            BigDecimal avgHours,
            boolean tipped,
            BigDecimal averageTip,
            boolean hasHousing,
            BigDecimal housingCost,
            BigDecimal secondJobHours,
            BigDecimal secondJobWage,
            Date start,
            Date end,
            String source
    ) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("jobId", sanitizeId(req.getJobId(), 64));
        payload.put("jobTitle", jobTitle);
        payload.put("company", company);
        payload.put("state", state);
        payload.put("hourlyWage", hourlyWage);
        payload.put("avgHoursPerWeek", avgHours);
        payload.put("tipped", tipped);
        payload.put("averageTip", averageTip);
        payload.put("hasHousing", hasHousing);
        payload.put("housingCostPerWeek", housingCost);
        payload.put("secondJobHours", secondJobHours);
        payload.put("secondJobHourlyWage", secondJobWage);
        payload.put("projectStartDate", start == null ? null : start.toString());
        payload.put("projectEndDate", end == null ? null : end.toString());
        payload.put("source", source);

        if (req.getExtras() != null) {
            Map<String, Object> extras = new LinkedHashMap<>();
            for (Map.Entry<String, Object> e : req.getExtras().entrySet()) {
                String key = StrUtil.trimToNull(e.getKey());
                if (key == null || !ALLOWED_EXTRA_KEYS.contains(key)) {
                    continue;
                }
                Object value = e.getValue();
                if (value == null) {
                    continue;
                }
                if (value instanceof Number || value instanceof Boolean) {
                    extras.put(key, value);
                } else if (value instanceof String s) {
                    String cleaned = sanitizeText(s, 500, key);
                    if (StrUtil.isNotBlank(cleaned)) {
                        extras.put(key, cleaned);
                    }
                } else if (value instanceof Iterable<?> it) {
                    // 仅允许数字数组（如 workHoursRange）
                    java.util.List<Number> nums = new java.util.ArrayList<>();
                    for (Object item : it) {
                        if (item instanceof Number n) {
                            nums.add(n);
                        }
                    }
                    if (!nums.isEmpty() && nums.size() <= 4) {
                        extras.put(key, nums);
                    }
                }
            }
            if (!extras.isEmpty()) {
                payload.put("extras", extras);
            }
        }
        return payload;
    }

    private static String sanitizeText(String raw, int maxLen, String field) {
        String s = StrUtil.trimToEmpty(raw);
        if (s.isEmpty()) {
            return "";
        }
        // 拒绝明显注入字符；MyBatis 参数化已防 SQL，此处再挡异常输入
        if (s.indexOf(';') >= 0 || s.indexOf("--") >= 0 || s.contains("/*") || s.contains("*/")) {
            throw new ClientException(field + "包含非法字符");
        }
        if (s.length() > maxLen) {
            s = s.substring(0, maxLen);
        }
        if (!SAFE_TEXT.matcher(s).matches()) {
            // 放宽：去掉控制字符后仍保留中英文数字常见符号
            String cleaned = s.replaceAll("[\\p{Cntrl}<>\\\\`$]", "");
            if (cleaned.isBlank()) {
                throw new ClientException(field + "无效");
            }
            return cleaned.length() > maxLen ? cleaned.substring(0, maxLen) : cleaned;
        }
        return s;
    }

    private static String sanitizeId(String raw, int maxLen) {
        String s = StrUtil.trimToEmpty(raw);
        if (s.isEmpty()) {
            return null;
        }
        s = s.replaceAll("[^A-Za-z0-9_\\-]", "");
        if (s.isEmpty()) {
            return null;
        }
        return s.length() > maxLen ? s.substring(0, maxLen) : s;
    }

    private static BigDecimal requireRange(BigDecimal value, String field, BigDecimal min, BigDecimal max) {
        if (value == null) {
            throw new ClientException(field + "不能为空");
        }
        return optionalRange(value, field, min, max);
    }

    private static BigDecimal optionalRange(BigDecimal value, String field, BigDecimal min, BigDecimal max) {
        if (value == null) {
            return null;
        }
        BigDecimal v = value.setScale(2, RoundingMode.HALF_UP);
        if (v.compareTo(min) < 0 || v.compareTo(max) > 0) {
            throw new ClientException(field + "超出允许范围");
        }
        return v;
    }

    private static Date parseDate(String raw, String field) {
        String s = StrUtil.trimToNull(raw);
        if (s == null) {
            return null;
        }
        try {
            return Date.valueOf(LocalDate.parse(s));
        } catch (DateTimeParseException | IllegalArgumentException ex) {
            throw new ClientException(field + "格式无效，需 YYYY-MM-DD");
        }
    }
}
