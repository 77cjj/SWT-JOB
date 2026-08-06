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

package com.nageoffer.ai.ragent.rag.core.web;

import cn.hutool.core.util.StrUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nageoffer.ai.ragent.framework.convention.ResourceReference;
import com.nageoffer.ai.ragent.rag.config.WebSearchProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebSearchService {

    private static final String TAVILY_URL = "https://api.tavily.com/search";

    private final WebSearchProperties properties;
    private final ObjectMapper objectMapper;

    @PostConstruct
    void logAvailability() {
        if (!properties.isEnabled()) {
            log.info("联网搜索(Tavily): 已在配置中关闭 (rag.web-search.enabled=false)");
            return;
        }
        if (StrUtil.isBlank(properties.getApiKey())) {
            log.warn("联网搜索(Tavily): 未配置 TAVILY_API_KEY，前端不会显示「联网搜索」按钮");
            return;
        }
        log.info("联网搜索(Tavily): 已配置 API Key ({}...)，联网搜索可用",
                properties.getApiKey().substring(0, Math.min(8, properties.getApiKey().length())));
    }

    public boolean isAvailable() {
        return properties.isEnabled() && StrUtil.isNotBlank(properties.getApiKey());
    }

    /** 供 capabilities 接口返回诊断信息（不含密钥） */
    public String availabilityStatus() {
        if (!properties.isEnabled()) {
            return "disabled";
        }
        if (StrUtil.isBlank(properties.getApiKey())) {
            return "missing_key";
        }
        return "ready";
    }

    public WebSearchBundle search(String query) {
        if (!isAvailable() || StrUtil.isBlank(query)) {
            return WebSearchBundle.builder().build();
        }
        try {
            Map<String, Object> body = Map.of(
                    "api_key", properties.getApiKey(),
                    "query", query.trim(),
                    "max_results", Math.max(1, Math.min(properties.getMaxResults(), 5)),
                    "search_depth", "basic",
                    "include_answer", false
            );
            String payload = objectMapper.writeValueAsString(body);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(TAVILY_URL))
                    .timeout(Duration.ofSeconds(Math.max(3, properties.getTimeoutSeconds())))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(5))
                    .build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("联网搜索失败 status={} body={}（若在国内服务器，请确认能访问 api.tavily.com）",
                        response.statusCode(), truncate(response.body(), 200));
                return WebSearchBundle.builder().build();
            }
            WebSearchBundle bundle = parseResponse(response.body());
            if (bundle.isEmpty()) {
                log.info("联网搜索无结果 query={}", truncate(query, 80));
            } else {
                log.info("联网搜索命中 {} 条 query={}", bundle.getResources().size(), truncate(query, 80));
            }
            return bundle;
        } catch (Exception ex) {
            log.warn("联网搜索异常 query={}（常见原因：服务器无法访问 api.tavily.com 或 Key 无效）",
                    truncate(query, 80), ex);
            return WebSearchBundle.builder().build();
        }
    }

    private WebSearchBundle parseResponse(String raw) throws Exception {
        JsonNode root = objectMapper.readTree(raw);
        JsonNode results = root.path("results");
        if (!results.isArray() || results.isEmpty()) {
            return WebSearchBundle.builder().build();
        }

        Map<String, ResourceReference> deduped = new LinkedHashMap<>();
        StringBuilder context = new StringBuilder();
        int index = 0;
        for (JsonNode item : results) {
            String url = text(item, "url");
            String title = text(item, "title");
            String content = text(item, "content");
            if (StrUtil.isBlank(url) && StrUtil.isBlank(content)) {
                continue;
            }
            String snippet = truncate(content, properties.getMaxSnippetChars());
            String key = normalizeUrl(url);
            if (StrUtil.isBlank(key)) {
                key = "web-" + (++index);
            }
            if (deduped.containsKey(key)) {
                continue;
            }
            deduped.put(key, ResourceReference.builder()
                    .title(StrUtil.isNotBlank(title) ? title : "网页来源")
                    .url(url)
                    .snippet(snippet)
                    .content(snippet)
                    .build());
            context.append("### ").append(StrUtil.blankToDefault(title, "来源")).append("\n");
            if (StrUtil.isNotBlank(url)) {
                context.append("URL: ").append(url).append("\n");
            }
            if (StrUtil.isNotBlank(snippet)) {
                context.append(snippet).append("\n");
            }
            context.append("\n");
        }
        return WebSearchBundle.builder()
                .contextText(context.toString().trim())
                .resources(new ArrayList<>(deduped.values()))
                .build();
    }

    private String text(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isMissingNode() || value.isNull() ? null : value.asText().trim();
    }

    private String normalizeUrl(String url) {
        if (StrUtil.isBlank(url)) {
            return null;
        }
        return url.trim().toLowerCase(Locale.ROOT).replaceAll("/+$", "");
    }

    private String truncate(String value, int max) {
        if (StrUtil.isBlank(value)) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.length() <= max ? trimmed : trimmed.substring(0, max) + "…";
    }
}
