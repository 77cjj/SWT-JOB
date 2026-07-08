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

package com.nageoffer.ai.ragent.infra.embedding;

import cn.hutool.core.collection.CollUtil;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.nageoffer.ai.ragent.infra.config.AIModelProperties;
import com.nageoffer.ai.ragent.infra.enums.ModelCapability;
import com.nageoffer.ai.ragent.infra.enums.ModelProvider;
import com.nageoffer.ai.ragent.infra.http.HttpMediaTypes;
import com.nageoffer.ai.ragent.infra.http.HttpResponseHelper;
import com.nageoffer.ai.ragent.infra.http.ModelClientErrorType;
import com.nageoffer.ai.ragent.infra.http.ModelClientException;
import com.nageoffer.ai.ragent.infra.http.ModelUrlResolver;
import com.nageoffer.ai.ragent.infra.model.ModelTarget;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 阿里云百炼 Embedding 客户端
 * <p>
 * 实现百炼大模型平台的文本嵌入功能，支持 OpenAI 兼容格式和百炼原生格式
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BailianEmbeddingClient implements EmbeddingClient {

    private final OkHttpClient httpClient;

    @Override
    public String provider() {
        return ModelProvider.BAI_LIAN.getId();
    }

    @Override
    public List<Float> embed(String text, ModelTarget target) {
        List<List<Float>> result = embedBatch(List.of(text), target);
        return result.isEmpty() ? List.of() : result.get(0);
    }

    @Override
    public List<List<Float>> embedBatch(List<String> texts, ModelTarget target) {
        if (CollUtil.isEmpty(texts)) {
            return Collections.emptyList();
        }

        AIModelProperties.ProviderConfig providerConfig = HttpResponseHelper.requireProvider(target, provider());
        HttpResponseHelper.requireApiKey(providerConfig, provider());

        String model = HttpResponseHelper.requireModel(target, provider());
        String url = resolveEmbeddingUrl(providerConfig, model);

        JsonObject reqBody = new JsonObject();
        reqBody.addProperty("model", model);

        // 百炼 OpenAI 兼容格式: input 直接是数组
        JsonArray textsArray = new JsonArray();
        for (String text : texts) {
            textsArray.add(text);
        }
        reqBody.add("input", textsArray);

        Request request = new Request.Builder()
                .url(url)
                .post(RequestBody.create(reqBody.toString(), HttpMediaTypes.JSON))
                .addHeader("Authorization", "Bearer " + providerConfig.getApiKey())
                .addHeader("Content-Type", "application/json")
                .build();

        JsonObject respJson;
        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String body = HttpResponseHelper.readBody(response.body());
                log.warn("{} embedding 请求失败: status={}, body={}", provider(), response.code(), body);
                throw new ModelClientException(
                        provider() + " embedding 请求失败: HTTP " + response.code(),
                        ModelClientErrorType.fromHttpStatus(response.code()),
                        response.code()
                );
            }
            respJson = HttpResponseHelper.parseJson(response.body(), provider());
        } catch (IOException e) {
            throw new ModelClientException(
                    provider() + " embedding 请求失败: " + e.getMessage(),
                    ModelClientErrorType.NETWORK_ERROR, null, e
            );
        }

        return parseEmbeddingResponse(respJson);
    }

    /**
     * 解析百炼 embedding 响应
     * 支持两种格式：
     * 1. OpenAI 兼容格式: { "data": [{ "embedding": [...] }] }
     * 2. 百炼原生格式: { "output": { "embeddings": [{ "embedding": [...] }] } }
     */
    private List<List<Float>> parseEmbeddingResponse(JsonObject respJson) {
        if (respJson.has("data")) {
            return parseOpenAIFormat(respJson);
        } else if (respJson.has("output")) {
            return parseBailianFormat(respJson);
        } else {
            throw new ModelClientException(
                    provider() + " embedding 响应格式未知",
                    ModelClientErrorType.INVALID_RESPONSE, null
            );
        }
    }

    private List<List<Float>> parseOpenAIFormat(JsonObject respJson) {
        JsonArray data = respJson.getAsJsonArray("data");
        if (data == null || data.isEmpty()) {
            throw new ModelClientException(
                    provider() + " embedding 响应中缺少 data 数组",
                    ModelClientErrorType.INVALID_RESPONSE, null
            );
        }

        List<List<Float>> results = new ArrayList<>();
        for (JsonElement el : data) {
            JsonObject obj = el.getAsJsonObject();
            JsonArray embedding = obj.getAsJsonArray("embedding");
            if (embedding == null || embedding.isEmpty()) {
                throw new ModelClientException(
                        provider() + " embedding 响应中缺少 embedding 字段",
                        ModelClientErrorType.INVALID_RESPONSE, null
                );
            }
            List<Float> vector = new ArrayList<>();
            for (JsonElement v : embedding) {
                vector.add(v.getAsFloat());
            }
            results.add(vector);
        }
        return results;
    }

    private List<List<Float>> parseBailianFormat(JsonObject respJson) {
        JsonObject output = respJson.getAsJsonObject("output");
        if (output == null) {
            throw new ModelClientException(
                    provider() + " embedding 响应中缺少 output 字段",
                    ModelClientErrorType.INVALID_RESPONSE, null
            );
        }

        JsonArray embeddings = output.getAsJsonArray("embeddings");
        if (embeddings == null || embeddings.isEmpty()) {
            throw new ModelClientException(
                    provider() + " embedding 响应中缺少 embeddings 数组",
                    ModelClientErrorType.INVALID_RESPONSE, null
            );
        }

        Map<Integer, List<Float>> indexedResults = embeddings.asList().stream()
                .filter(JsonElement::isJsonObject)
                .map(JsonElement::getAsJsonObject)
                .filter(obj -> obj.has("embedding") && obj.has("text_index"))
                .collect(Collectors.toMap(
                        obj -> obj.get("text_index").getAsInt(),
                        obj -> {
                            JsonArray emb = obj.getAsJsonArray("embedding");
                            List<Float> vector = new ArrayList<>();
                            for (JsonElement v : emb) {
                                vector.add(v.getAsFloat());
                            }
                            return vector;
                        }
                ));

        List<List<Float>> results = new ArrayList<>(indexedResults.size());
        for (int i = 0; i < indexedResults.size(); i++) {
            results.add(indexedResults.getOrDefault(i, List.of()));
        }
        return results;
    }

    /**
     * 解析百炼 embedding URL
     * 优先使用 compatible-mode 端点以支持 OpenAI 兼容格式
     */
    private String resolveEmbeddingUrl(AIModelProperties.ProviderConfig providerConfig, String model) {
        Map<String, String> endpoints = providerConfig.getEndpoints();

        if (endpoints != null && endpoints.containsKey("embedding")) {
            String endpoint = endpoints.get("embedding");
            if (endpoint.contains("compatible-mode")) {
                return providerConfig.getUrl() + endpoint;
            }
        }

        if (endpoints != null && endpoints.containsKey("chat")) {
            String chatEndpoint = endpoints.get("chat");
            String basePath = chatEndpoint.substring(0, chatEndpoint.lastIndexOf("/chat"));
            return providerConfig.getUrl() + basePath + "/embeddings";
        }

        return providerConfig.getUrl() + "/compatible-mode/v1/embeddings";
    }
}
