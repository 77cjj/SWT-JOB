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

package com.nageoffer.ai.ragent.rag.service;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.nageoffer.ai.ragent.framework.convention.ResourceReference;
import com.nageoffer.ai.ragent.framework.convention.RetrievedChunk;
import com.nageoffer.ai.ragent.knowledge.dao.entity.KnowledgeChunkDO;
import com.nageoffer.ai.ragent.knowledge.dao.entity.KnowledgeDocumentDO;
import com.nageoffer.ai.ragent.knowledge.dao.mapper.KnowledgeChunkMapper;
import com.nageoffer.ai.ragent.knowledge.dao.mapper.KnowledgeDocumentMapper;
import com.nageoffer.ai.ragent.rag.dto.RetrievalContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.nageoffer.ai.ragent.rag.constant.RAGConstant.RESOURCE_MAX_COUNT;
import static com.nageoffer.ai.ragent.rag.constant.RAGConstant.RESOURCE_MIN_SCORE;
import static com.nageoffer.ai.ragent.rag.constant.RAGConstant.RESOURCE_SCORE_MARGIN_RATIO;

/**
 * 将检索结果解析为可展示资源引用（按相关性筛选、去重、映射前台文档路径）
 */
@Service
@RequiredArgsConstructor
public class ResourceReferenceResolver {

    private static final Pattern DOCS_SLUG_PATTERN = Pattern.compile(
            "(?:/pages/docs/|/docs/|resources/docs/)([\\w./-]+?)\\.(?:mdx?|MDX?)"
    );
    private static final Pattern DEALS_PATH_PATTERN = Pattern.compile("^/deals(?:/([a-z0-9-]+))?$", Pattern.CASE_INSENSITIVE);

    private static final int SNIPPET_MAX_CHARS = 180;
    private static final int CONTENT_MAX_CHARS = 2400;

    private final KnowledgeChunkMapper knowledgeChunkMapper;
    private final KnowledgeDocumentMapper knowledgeDocumentMapper;

    public List<ResourceReference> resolve(RetrievalContext retrievalContext) {
        if (retrievalContext == null || retrievalContext.getIntentChunks() == null || retrievalContext.getIntentChunks().isEmpty()) {
            return List.of();
        }

        Map<String, RetrievedChunk> topChunkById = collectBestChunks(retrievalContext);
        if (topChunkById.isEmpty()) {
            return List.of();
        }

        List<RetrievedChunk> ranked = topChunkById.values().stream()
                .sorted(Comparator.comparing(RetrievedChunk::getScore, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        ranked = filterByRelevance(ranked);
        if (ranked.isEmpty()) {
            return List.of();
        }

        List<String> chunkIds = ranked.stream().map(RetrievedChunk::getId).filter(StrUtil::isNotBlank).toList();
        List<KnowledgeChunkDO> chunkRecords = knowledgeChunkMapper.selectBatchIds(chunkIds);
        if (chunkRecords == null || chunkRecords.isEmpty()) {
            return List.of();
        }

        Map<String, KnowledgeChunkDO> chunkById = chunkRecords.stream()
                .filter(each -> each != null && StrUtil.isNotBlank(each.getId()))
                .collect(java.util.stream.Collectors.toMap(KnowledgeChunkDO::getId, each -> each, (a, b) -> a));

        List<String> docIds = chunkById.values().stream()
                .map(KnowledgeChunkDO::getDocId)
                .filter(StrUtil::isNotBlank)
                .distinct()
                .toList();
        Map<String, KnowledgeDocumentDO> docById = loadDocMap(docIds);

        Map<String, ResourceReference> deduplicated = new LinkedHashMap<>();
        Set<String> seenTitles = new HashSet<>();
        Set<String> seenFingerprints = new HashSet<>();
        Set<String> seenDocsPaths = new HashSet<>();
        Set<String> seenDocNames = new HashSet<>();

        for (RetrievedChunk retrievedChunk : ranked) {
            if (deduplicated.size() >= RESOURCE_MAX_COUNT) {
                break;
            }
            KnowledgeChunkDO chunk = chunkById.get(retrievedChunk.getId());
            if (chunk == null) {
                continue;
            }
            KnowledgeDocumentDO doc = docById.get(chunk.getDocId());
            String chunkText = firstNonBlank(chunk.getContent(), retrievedChunk.getText());
            String title = resolveTitle(doc, chunkText);
            String titleKey = normalizeDedupKey(title);
            String fingerprint = contentFingerprint(chunkText);
            String docsPath = resolveDocsPath(doc);
            String docNameKey = normalizeDedupKey(doc != null ? doc.getDocName() : null);

            if (StrUtil.isNotBlank(titleKey) && seenTitles.contains(titleKey)) {
                continue;
            }
            if (StrUtil.isNotBlank(fingerprint) && seenFingerprints.contains(fingerprint)) {
                continue;
            }
            if (StrUtil.isNotBlank(docsPath) && seenDocsPaths.contains(docsPath)) {
                continue;
            }
            if (StrUtil.isNotBlank(docNameKey) && seenDocNames.contains(docNameKey)) {
                continue;
            }

            String docKey = StrUtil.isNotBlank(chunk.getDocId()) ? chunk.getDocId() : chunk.getId();
            if (deduplicated.containsKey(docKey)) {
                continue;
            }

            ResourceReference resource = ResourceReference.builder()
                    .title(title)
                    .url(resolvePublicUrl(doc))
                    .snippet(buildSnippet(chunkText))
                    .content(buildContent(chunkText))
                    .score(retrievedChunk.getScore())
                    .kbId(chunk.getKbId())
                    .docId(chunk.getDocId())
                    .chunkId(chunk.getId())
                    .build();
            applyReferralMetadata(resource, doc);
            deduplicated.put(docKey, resource);
            if (StrUtil.isNotBlank(titleKey)) {
                seenTitles.add(titleKey);
            }
            if (StrUtil.isNotBlank(fingerprint)) {
                seenFingerprints.add(fingerprint);
            }
            if (StrUtil.isNotBlank(docsPath)) {
                seenDocsPaths.add(docsPath);
            }
            if (StrUtil.isNotBlank(docNameKey)) {
                seenDocNames.add(docNameKey);
            }
        }
        return new ArrayList<>(deduplicated.values());
    }

    private String normalizeDedupKey(String raw) {
        if (StrUtil.isBlank(raw)) {
            return null;
        }
        return raw.trim()
                .toLowerCase(Locale.ROOT)
                .replaceAll("\\s+", "")
                .replaceAll("[/_\\\\-]+", "");
    }

    private String contentFingerprint(String content) {
        if (StrUtil.isBlank(content)) {
            return null;
        }
        String normalized = content.trim()
                .toLowerCase(Locale.ROOT)
                .replaceAll("\\s+", " ");
        int len = Math.min(normalized.length(), 240);
        return normalized.substring(0, len);
    }

    private Map<String, RetrievedChunk> collectBestChunks(RetrievalContext retrievalContext) {
        Map<String, RetrievedChunk> topChunkById = new LinkedHashMap<>();
        retrievalContext.getIntentChunks().values().stream()
                .flatMap(List::stream)
                .filter(Objects::nonNull)
                .forEach(chunk -> {
                    if (StrUtil.isBlank(chunk.getId())) {
                        return;
                    }
                    RetrievedChunk current = topChunkById.get(chunk.getId());
                    if (current == null || betterScore(chunk, current)) {
                        topChunkById.put(chunk.getId(), chunk);
                    }
                });
        return topChunkById;
    }

    private boolean betterScore(RetrievedChunk candidate, RetrievedChunk current) {
        if (candidate.getScore() == null) {
            return current.getScore() == null;
        }
        if (current.getScore() == null) {
            return true;
        }
        return candidate.getScore() > current.getScore();
    }

    private List<RetrievedChunk> filterByRelevance(List<RetrievedChunk> ranked) {
        List<RetrievedChunk> scored = ranked.stream()
                .filter(chunk -> chunk.getScore() != null)
                .toList();
        if (scored.isEmpty()) {
            return ranked.stream().limit(RESOURCE_MAX_COUNT).toList();
        }

        float topScore = scored.get(0).getScore();
        float relativeFloor = topScore * RESOURCE_SCORE_MARGIN_RATIO;
        return scored.stream()
                .filter(chunk -> chunk.getScore() >= RESOURCE_MIN_SCORE && chunk.getScore() >= relativeFloor)
                .limit(RESOURCE_MAX_COUNT)
                .toList();
    }

    private Map<String, KnowledgeDocumentDO> loadDocMap(List<String> docIds) {
        if (docIds == null || docIds.isEmpty()) {
            return Map.of();
        }
        List<KnowledgeDocumentDO> documents = knowledgeDocumentMapper.selectList(
                Wrappers.lambdaQuery(KnowledgeDocumentDO.class)
                        .in(KnowledgeDocumentDO::getId, docIds)
                        .eq(KnowledgeDocumentDO::getDeleted, 0)
        );
        if (documents == null || documents.isEmpty()) {
            return Map.of();
        }
        return documents.stream()
                .filter(each -> each != null && StrUtil.isNotBlank(each.getId()))
                .collect(java.util.stream.Collectors.toMap(KnowledgeDocumentDO::getId, each -> each, (a, b) -> a));
    }

    /**
     * 仅返回用户可访问的公开路径；内部存储 URL 不暴露给前端跳转
     */
    private String resolvePublicUrl(KnowledgeDocumentDO documentDO) {
        if (documentDO == null) {
            return null;
        }
        String dealsPath = resolveDealsPath(documentDO);
        if (StrUtil.isNotBlank(dealsPath)) {
            return dealsPath;
        }
        String docsPath = resolveDocsPath(documentDO);
        if (StrUtil.isNotBlank(docsPath)) {
            return docsPath;
        }
        String sourceLocation = StrUtil.trimToNull(documentDO.getSourceLocation());
        if (sourceLocation != null && sourceLocation.startsWith("/docs/")) {
            return sourceLocation;
        }
        if (sourceLocation != null && sourceLocation.startsWith("/deals")) {
            return normalizeDealsPath(sourceLocation);
        }
        if (sourceLocation != null && isPublicHttpUrl(sourceLocation)) {
            return sourceLocation;
        }
        return null;
    }

    private void applyReferralMetadata(ResourceReference resource, KnowledgeDocumentDO documentDO) {
        if (resource == null || documentDO == null) {
            return;
        }
        String dealsPath = resolveDealsPath(documentDO);
        if (StrUtil.isBlank(dealsPath)) {
            return;
        }
        resource.setType("referral");
        resource.setUrl(dealsPath);
        Matcher matcher = DEALS_PATH_PATTERN.matcher(dealsPath);
        if (matcher.matches()) {
            resource.setDealId(StrUtil.trimToNull(matcher.group(1)));
        }
    }

    private String resolveDealsPath(KnowledgeDocumentDO documentDO) {
        if (documentDO == null) {
            return null;
        }
        // List.of rejects null elements, while legacy/imported documents commonly have
        // only one of these fields populated.
        for (String candidate : new String[]{documentDO.getSourceLocation(), documentDO.getFileUrl(), documentDO.getDocName()}) {
            String dealsPath = extractDealsPath(candidate);
            if (StrUtil.isNotBlank(dealsPath)) {
                return dealsPath;
            }
        }
        return null;
    }

    private String extractDealsPath(String raw) {
        if (StrUtil.isBlank(raw)) {
            return null;
        }
        String trimmed = raw.trim();
        if (trimmed.startsWith("/deals")) {
            return normalizeDealsPath(trimmed);
        }
        return null;
    }

    private String normalizeDealsPath(String path) {
        if (StrUtil.isBlank(path)) {
            return null;
        }
        String normalized = path.trim().replaceAll("/+", "/");
        if ("/deals".equals(normalized) || normalized.startsWith("/deals/")) {
            return normalized.toLowerCase(Locale.ROOT);
        }
        return null;
    }

    private String resolveDocsPath(KnowledgeDocumentDO documentDO) {
        if (documentDO == null) {
            return null;
        }
        for (String candidate : new String[]{documentDO.getSourceLocation(), documentDO.getFileUrl(), documentDO.getDocName()}) {
            String docsPath = extractDocsPath(candidate);
            if (StrUtil.isNotBlank(docsPath)) {
                return docsPath;
            }
        }
        return null;
    }

    private String extractDocsPath(String raw) {
        if (StrUtil.isBlank(raw)) {
            return null;
        }
        String trimmed = raw.trim();
        if (trimmed.startsWith("/docs/")) {
            return normalizeDocsSlug(trimmed.substring("/docs/".length()));
        }
        Matcher matcher = DOCS_SLUG_PATTERN.matcher(trimmed.replace('\\', '/'));
        if (matcher.find()) {
            return normalizeDocsSlug(matcher.group(1));
        }
        return null;
    }

    private String normalizeDocsSlug(String slug) {
        if (StrUtil.isBlank(slug)) {
            return null;
        }
        String normalized = slug.trim()
                .replace('\\', '/')
                .replaceAll("/+", "/")
                .replaceAll("^/+", "")
                .replaceAll("/+$", "");
        if (normalized.isEmpty()) {
            return null;
        }
        return "/docs/" + normalized.toLowerCase(Locale.ROOT);
    }

    private boolean isPublicHttpUrl(String url) {
        String lower = url.toLowerCase(Locale.ROOT);
        if (lower.contains("localhost") || lower.contains("127.0.0.1") || lower.contains("rustfs")) {
            return false;
        }
        return lower.startsWith("https://") || lower.startsWith("http://");
    }

    private String resolveTitle(KnowledgeDocumentDO doc, String chunkText) {
        if (doc != null && StrUtil.isNotBlank(doc.getDocName())) {
            String name = doc.getDocName().trim();
            if (name.endsWith(".md") || name.endsWith(".mdx")) {
                name = name.substring(0, name.lastIndexOf('.'));
            }
            int slash = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'));
            if (slash >= 0 && slash < name.length() - 1) {
                name = name.substring(slash + 1);
            }
            return name;
        }
        if (StrUtil.isNotBlank(chunkText)) {
            String firstLine = chunkText.lines().findFirst().orElse("").trim();
            firstLine = firstLine.replaceAll("^#+\\s*", "");
            if (firstLine.length() > 48) {
                firstLine = firstLine.substring(0, 48) + "…";
            }
            if (StrUtil.isNotBlank(firstLine)) {
                return firstLine;
            }
        }
        return "参考文档";
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (StrUtil.isNotBlank(value)) {
                return value.trim();
            }
        }
        return null;
    }

    private String buildSnippet(String content) {
        return truncate(content, SNIPPET_MAX_CHARS);
    }

    private String buildContent(String content) {
        return truncate(content, CONTENT_MAX_CHARS);
    }

    private String truncate(String content, int maxChars) {
        if (StrUtil.isBlank(content)) {
            return null;
        }
        String trimmed = content.trim();
        if (trimmed.length() <= maxChars) {
            return trimmed;
        }
        return trimmed.substring(0, maxChars) + "…";
    }
}
