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

package com.nageoffer.ai.ragent.deals.service;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.nageoffer.ai.ragent.deals.config.ReferralDealProperties;
import com.nageoffer.ai.ragent.deals.dao.entity.ReferralDealDO;
import com.nageoffer.ai.ragent.deals.dao.mapper.ReferralDealMapper;
import com.nageoffer.ai.ragent.deals.support.ReferralDealMarkdownGenerator;
import com.nageoffer.ai.ragent.framework.convention.ResourceReference;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 在 RAG 检索结果中补充/增强薅羊毛 refer 资源，供前端显眼渲染
 */
@Service
@RequiredArgsConstructor
public class ReferralDealResourceEnricher {

    private static final Pattern DEALS_PATH = Pattern.compile("^/deals(?:/([a-z0-9-]+))?$", Pattern.CASE_INSENSITIVE);
    private static final List<String> DEAL_KEYWORDS = List.of(
            "羊毛", "薅", "refer", "referral", "开户", "奖励", "返现", "bonus",
            "chime", "kalshi", "revolut", "sofi", "rakuten", "moomoo", "weee", "capital one", "wells fargo"
    );

    private final ReferralDealMapper referralDealMapper;
    private final ReferralDealProperties properties;

    public List<ResourceReference> enrich(String question, List<ResourceReference> resources) {
        if (!properties.isInjectResources()) {
            return resources != null ? resources : List.of();
        }
        Map<String, ResourceReference> merged = new LinkedHashMap<>();
        if (resources != null) {
            for (ResourceReference resource : resources) {
                ResourceReference enriched = enrichExisting(resource);
                String key = dedupeKey(enriched);
                merged.putIfAbsent(key, enriched);
            }
        }

        if (shouldInject(question, merged)) {
            for (ResourceReference injected : matchDeals(question, properties.getMaxInjectCount())) {
                merged.putIfAbsent(dedupeKey(injected), injected);
            }
        }

        return new ArrayList<>(merged.values());
    }

    private ResourceReference enrichExisting(ResourceReference resource) {
        if (resource == null) {
            return null;
        }
        String dealId = extractDealId(resource.getUrl());
        if (dealId == null) {
            dealId = StrUtil.trimToNull(resource.getDealId());
        }
        if (dealId == null) {
            return resource;
        }
        ReferralDealDO deal = loadPublished(dealId);
        if (deal == null) {
            return markReferral(resource, dealId, null);
        }
        return buildReferralResource(deal, resource.getScore(), resource.getSnippet(), resource.getContent());
    }

    private boolean shouldInject(String question, Map<String, ResourceReference> existing) {
        if (!containsDealKeyword(question)) {
            return false;
        }
        long referralCount = existing.values().stream()
                .filter(item -> "referral".equals(item.getType()))
                .count();
        return referralCount < properties.getMaxInjectCount();
    }

    private List<ResourceReference> matchDeals(String question, int limit) {
        List<ReferralDealDO> deals = referralDealMapper.selectList(
                Wrappers.lambdaQuery(ReferralDealDO.class)
                        .eq(ReferralDealDO::getDeleted, 0)
                        .eq(ReferralDealDO::getPublished, 1)
                        .orderByAsc(ReferralDealDO::getSortOrder)
                        .orderByAsc(ReferralDealDO::getId)
        );
        if (deals == null || deals.isEmpty()) {
            return List.of();
        }
        String normalizedQuestion = normalize(question);
        List<ScoredDeal> scored = new ArrayList<>();
        for (ReferralDealDO deal : deals) {
            int score = scoreDeal(normalizedQuestion, deal);
            if (score > 0) {
                scored.add(new ScoredDeal(deal, score));
            }
        }
        scored.sort(Comparator.comparingInt(ScoredDeal::score).reversed()
                .thenComparing(item -> item.deal().getSortOrder(), Comparator.nullsLast(Integer::compareTo)));
        List<ResourceReference> result = new ArrayList<>();
        for (ScoredDeal item : scored) {
            if (result.size() >= limit) {
                break;
            }
            result.add(buildReferralResource(item.deal(), 0.95f, null, null));
        }
        if (result.isEmpty() && containsDealKeyword(question)) {
            for (ReferralDealDO deal : deals) {
                if (result.size() >= limit) {
                    break;
                }
                result.add(buildReferralResource(deal, 0.75f, null, null));
            }
        }
        return result;
    }

    private int scoreDeal(String question, ReferralDealDO deal) {
        int score = 0;
        String id = deal.getId().toLowerCase(Locale.ROOT);
        if (question.contains(id)) {
            score += 10;
        }
        JsonObject program = parseProgram(deal);
        if (program == null) {
            return score;
        }
        String brandZh = pickZh(program, "brandName");
        String brandEn = pickEn(program, "brandName");
        if (StrUtil.isNotBlank(brandZh) && question.contains(normalize(brandZh))) {
            score += 8;
        }
        if (StrUtil.isNotBlank(brandEn) && question.contains(normalize(brandEn))) {
            score += 6;
        }
        JsonObject edition = latestEdition(program);
        if (edition != null) {
            for (String token : List.of(pickZh(edition, "summary"), pickZh(edition, "reward"))) {
                if (StrUtil.isNotBlank(token)) {
                    for (String word : normalize(token).split("\\s+")) {
                        if (word.length() >= 3 && question.contains(word)) {
                            score += 1;
                        }
                    }
                }
            }
        }
        return score;
    }

    private ResourceReference buildReferralResource(ReferralDealDO deal, Float score, String snippet, String content) {
        JsonObject program = parseProgram(deal);
        JsonObject edition = program != null ? latestEdition(program) : null;
        String brand = program != null ? pickZh(program, "brandName") : deal.getId();
        String reward = edition != null ? pickZh(edition, "reward") : null;
        String summary = edition != null ? pickZh(edition, "summary") : null;
        String referralUrl = edition != null ? textOrNull(edition, "referralUrl") : null;
        String siteRebate = StrUtil.trimToNull(deal.getSiteRebateLabelZh());
        if (snippet == null) {
            snippet = summary;
        }
        if (content == null) {
            content = ReferralDealMarkdownGenerator.generateDealDocument(deal);
        }
        return ResourceReference.builder()
                .type("referral")
                .dealId(deal.getId())
                .title(brand)
                .url(ReferralDealMarkdownGenerator.dealsSourceLocation(deal.getId()))
                .referralUrl(referralUrl)
                .rewardLabel(reward)
                .siteRebateLabel(siteRebate)
                .snippet(snippet)
                .content(content)
                .score(score)
                .build();
    }

    private ResourceReference markReferral(ResourceReference resource, String dealId, ReferralDealDO deal) {
        ResourceReference.ResourceReferenceBuilder builder = ResourceReference.builder()
                .title(resource.getTitle())
                .url(resource.getUrl() != null ? resource.getUrl() : ReferralDealMarkdownGenerator.dealsSourceLocation(dealId))
                .snippet(resource.getSnippet())
                .content(resource.getContent())
                .score(resource.getScore())
                .kbId(resource.getKbId())
                .docId(resource.getDocId())
                .chunkId(resource.getChunkId())
                .type("referral")
                .dealId(dealId);
        if (deal != null) {
            JsonObject program = parseProgram(deal);
            JsonObject edition = program != null ? latestEdition(program) : null;
            if (edition != null) {
                builder.referralUrl(textOrNull(edition, "referralUrl"))
                        .rewardLabel(pickZh(edition, "reward"))
                        .siteRebateLabel(deal.getSiteRebateLabelZh());
            }
        } else {
            builder.referralUrl(resource.getReferralUrl())
                    .rewardLabel(resource.getRewardLabel())
                    .siteRebateLabel(resource.getSiteRebateLabel());
        }
        return builder.build();
    }

    private ReferralDealDO loadPublished(String dealId) {
        return referralDealMapper.selectOne(
                Wrappers.lambdaQuery(ReferralDealDO.class)
                        .eq(ReferralDealDO::getId, dealId)
                        .eq(ReferralDealDO::getDeleted, 0)
                        .eq(ReferralDealDO::getPublished, 1)
        );
    }

    private String dedupeKey(ResourceReference resource) {
        if (resource == null) {
            return "null";
        }
        if (StrUtil.isNotBlank(resource.getDealId())) {
            return "deal:" + resource.getDealId();
        }
        if (StrUtil.isNotBlank(resource.getUrl())) {
            return "url:" + resource.getUrl();
        }
        return "title:" + StrUtil.blankToDefault(resource.getTitle(), "unknown");
    }

    private String extractDealId(String url) {
        if (StrUtil.isBlank(url)) {
            return null;
        }
        Matcher matcher = DEALS_PATH.matcher(url.trim());
        if (!matcher.matches()) {
            return null;
        }
        return StrUtil.trimToNull(matcher.group(1));
    }

    private boolean containsDealKeyword(String question) {
        if (StrUtil.isBlank(question)) {
            return false;
        }
        String normalized = normalize(question);
        for (String keyword : DEAL_KEYWORDS) {
            if (normalized.contains(normalize(keyword))) {
                return true;
            }
        }
        return false;
    }

    private String normalize(String raw) {
        return raw.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+", " ");
    }

    private JsonObject parseProgram(ReferralDealDO deal) {
        try {
            return JsonParser.parseString(deal.getProgramJson().trim()).getAsJsonObject();
        } catch (Exception ex) {
            return null;
        }
    }

    private JsonObject latestEdition(JsonObject program) {
        if (program == null || !program.has("editions") || !program.get("editions").isJsonArray()) {
            return null;
        }
        JsonObject latest = null;
        String latestFrom = "";
        for (var element : program.getAsJsonArray("editions")) {
            if (!element.isJsonObject()) {
                continue;
            }
            JsonObject edition = element.getAsJsonObject();
            String from = textOrNull(edition, "validFrom");
            if (latest == null || (from != null && from.compareTo(latestFrom) > 0)) {
                latest = edition;
                latestFrom = from != null ? from : "";
            }
        }
        return latest;
    }

    private String pickZh(JsonObject obj, String field) {
        if (obj == null || !obj.has(field)) {
            return "";
        }
        var element = obj.get(field);
        if (element.isJsonObject() && element.getAsJsonObject().has("zh")) {
            return element.getAsJsonObject().get("zh").getAsString();
        }
        if (element.isJsonPrimitive()) {
            return element.getAsString();
        }
        return "";
    }

    private String pickEn(JsonObject obj, String field) {
        if (obj == null || !obj.has(field)) {
            return "";
        }
        var element = obj.get(field);
        if (element.isJsonObject() && element.getAsJsonObject().has("en")) {
            return element.getAsJsonObject().get("en").getAsString();
        }
        return "";
    }

    private String textOrNull(JsonObject obj, String field) {
        if (obj == null || !obj.has(field) || obj.get(field).isJsonNull()) {
            return null;
        }
        return obj.get(field).getAsString();
    }

    private record ScoredDeal(ReferralDealDO deal, int score) {
    }
}
