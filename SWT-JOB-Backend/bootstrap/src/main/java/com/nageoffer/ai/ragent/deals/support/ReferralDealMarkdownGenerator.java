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

package com.nageoffer.ai.ragent.deals.support;

import cn.hutool.core.util.StrUtil;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.nageoffer.ai.ragent.deals.dao.entity.ReferralDealDO;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

/**
 * 将薅羊毛项目 JSON 转为 RAG 可用的 Markdown 文档
 */
public final class ReferralDealMarkdownGenerator {

    private ReferralDealMarkdownGenerator() {
    }

    public static String generateIndex(List<ReferralDealDO> deals) {
        StringBuilder sb = new StringBuilder();
        sb.append("# SWT 薅羊毛 / Refer 项目索引\n\n");
        sb.append("> 奖励与条款随时变化，**以各品牌官网与本站 [薅羊毛](/deals) 页为准**。下文供 AI 问答检索。\n\n");
        sb.append("## 站内入口\n\n");
        sb.append("- [薅羊毛首页](/deals)：当前活动、邀请链接、领取攻略\n");
        sb.append("- [副业与羊毛攻略](/docs/return/side-hustles)：原理与深度说明\n");
        sb.append("- [低存款门槛银行开户奖励](/docs/return/low-deposit-bank-bonuses)\n\n");
        sb.append("## 当前上架项目\n\n");
        if (deals == null || deals.isEmpty()) {
            sb.append("（暂无已上架项目）\n");
            return sb.toString();
        }
        List<ReferralDealDO> sorted = new ArrayList<>(deals);
        sorted.sort(Comparator.comparing(ReferralDealDO::getSortOrder, Comparator.nullsLast(Integer::compareTo))
                .thenComparing(ReferralDealDO::getId));
        for (ReferralDealDO deal : sorted) {
            JsonObject program = parseProgram(deal);
            if (program == null) {
                continue;
            }
            String brand = pickZh(program, "brandName");
            JsonObject edition = latestEdition(program);
            String reward = edition != null ? pickZh(edition, "reward") : "";
            sb.append("- **").append(brand).append("**");
            if (StrUtil.isNotBlank(reward)) {
                sb.append(" — ").append(reward);
            }
            sb.append(" → [详情](/deals/").append(deal.getId()).append(")\n");
        }
        return sb.toString();
    }

    public static String generateDealDocument(ReferralDealDO deal) {
        JsonObject program = parseProgram(deal);
        if (program == null) {
            return "# " + deal.getId() + "\n\n（项目数据解析失败）\n";
        }
        String brand = pickZh(program, "brandName");
        String offerKind = program.has("offerKind") ? program.get("offerKind").getAsString() : "refer";
        JsonObject edition = latestEdition(program);

        StringBuilder sb = new StringBuilder();
        sb.append("# ").append(brand).append("（薅羊毛 / Refer）\n\n");
        sb.append("> 项目 ID：`").append(deal.getId()).append("` · 类型：`").append(offerKind).append("`\n");
        sb.append("> 站内详情页：[/deals/").append(deal.getId()).append("](/deals/").append(deal.getId()).append(")\n\n");

        if (edition != null) {
            appendLine(sb, "## 当前奖励", pickZh(edition, "reward"));
            appendLine(sb, "## 活动摘要", pickZh(edition, "summary"));
            appendPeriod(sb, edition);
            appendList(sb, "## 参与条件", pickZhList(edition, "requirements"));
            String referralUrl = textOrNull(edition, "referralUrl");
            if (StrUtil.isNotBlank(referralUrl)) {
                sb.append("## 邀请链接\n\n");
                sb.append("- 注册/邀请 URL：").append(referralUrl).append("\n");
                sb.append("- 务必使用本站 [薅羊毛详情页](/deals/").append(deal.getId()).append(") 中的链接，否则 refer 可能不计入。\n\n");
            }
            String officialUrl = textOrNull(edition, "officialUrl");
            if (StrUtil.isNotBlank(officialUrl)) {
                sb.append("## 官方条款页\n\n").append(officialUrl).append("\n\n");
            }
        }

        appendSiteRebate(sb, deal);
        appendList(sb, "## 如何领取（步骤）", pickZhList(program, "howToClaim"));
        appendList(sb, "## 实操避坑", pickZhList(program, "practicalSteps"));
        appendLine(sb, "## 官方补充说明", pickZh(program, "officialDetail"));

        sb.append("\n---\n\n");
        sb.append("关键词：薅羊毛 refer 开户奖励 返现 ").append(brand).append(" ").append(deal.getId()).append("\n");
        return sb.toString();
    }

    private static void appendSiteRebate(StringBuilder sb, ReferralDealDO deal) {
        String label = StrUtil.trimToNull(deal.getSiteRebateLabelZh());
        BigDecimal usd = deal.getSiteRebateUsd();
        if (label == null && usd == null) {
            return;
        }
        sb.append("## 本站额外返现\n\n");
        if (label != null) {
            sb.append("- ").append(label).append("\n");
        }
        if (usd != null) {
            sb.append("- 配置金额约 $").append(usd.stripTrailingZeros().toPlainString()).append("\n");
        }
        sb.append("\n");
    }

    private static void appendPeriod(StringBuilder sb, JsonObject edition) {
        String from = textOrNull(edition, "validFrom");
        String until = textOrNull(edition, "validUntil");
        if (from == null && until == null) {
            return;
        }
        sb.append("## 有效期\n\n");
        sb.append("- 开始：").append(from != null ? from : "未知").append("\n");
        sb.append("- 结束：").append(until != null ? until : "长期有效").append("\n\n");
    }

    private static void appendLine(StringBuilder sb, String heading, String body) {
        if (StrUtil.isBlank(body)) {
            return;
        }
        sb.append(heading).append("\n\n").append(body.trim()).append("\n\n");
    }

    private static void appendList(StringBuilder sb, String heading, List<String> items) {
        if (items == null || items.isEmpty()) {
            return;
        }
        sb.append(heading).append("\n\n");
        for (String item : items) {
            if (StrUtil.isNotBlank(item)) {
                sb.append("- ").append(item.trim()).append("\n");
            }
        }
        sb.append("\n");
    }

    private static JsonObject parseProgram(ReferralDealDO deal) {
        if (deal == null || StrUtil.isBlank(deal.getProgramJson())) {
            return null;
        }
        try {
            return JsonParser.parseString(deal.getProgramJson().trim()).getAsJsonObject();
        } catch (Exception ex) {
            return null;
        }
    }

    private static JsonObject latestEdition(JsonObject program) {
        if (program == null || !program.has("editions") || !program.get("editions").isJsonArray()) {
            return null;
        }
        JsonArray editions = program.getAsJsonArray("editions");
        JsonObject latest = null;
        String latestFrom = "";
        for (JsonElement element : editions) {
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

    private static String pickZh(JsonObject obj, String field) {
        if (obj == null || !obj.has(field)) {
            return "";
        }
        JsonElement element = obj.get(field);
        if (element.isJsonObject()) {
            JsonObject bilingual = element.getAsJsonObject();
            if (bilingual.has("zh")) {
                return bilingual.get("zh").getAsString();
            }
        } else if (element.isJsonPrimitive()) {
            return element.getAsString();
        }
        return "";
    }

    private static List<String> pickZhList(JsonObject obj, String field) {
        List<String> result = new ArrayList<>();
        if (obj == null || !obj.has(field)) {
            return result;
        }
        JsonElement element = obj.get(field);
        if (element.isJsonObject()) {
            JsonObject bilingual = element.getAsJsonObject();
            if (bilingual.has("zh") && bilingual.get("zh").isJsonArray()) {
                for (JsonElement item : bilingual.getAsJsonArray("zh")) {
                    result.add(item.getAsString());
                }
            }
        }
        return result;
    }

    private static String textOrNull(JsonObject obj, String field) {
        if (obj == null || !obj.has(field) || obj.get(field).isJsonNull()) {
            return null;
        }
        return obj.get(field).getAsString();
    }

    public static String dealsSourceLocation(String dealId) {
        if (StrUtil.isBlank(dealId)) {
            return "/deals";
        }
        return "/deals/" + dealId.trim().toLowerCase(Locale.ROOT);
    }
}
