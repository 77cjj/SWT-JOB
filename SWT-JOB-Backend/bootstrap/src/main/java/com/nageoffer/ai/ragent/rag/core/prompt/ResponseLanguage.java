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

package com.nageoffer.ai.ragent.rag.core.prompt;

import cn.hutool.core.util.StrUtil;

import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * 将前端 UI 语言代码映射为模型输出语言约束。
 */
public final class ResponseLanguage {

    public static final String DEFAULT = "zh";

    private static final Set<String> SUPPORTED = Set.of(
            "zh", "en", "pt", "tr", "ru", "uk", "ro", "pl", "es", "kk",
            "th", "vi", "fil", "cs", "hu", "sr", "bg", "az", "ka", "hy"
    );

    private static final Map<String, String> DISPLAY_NAMES = Map.ofEntries(
            Map.entry("zh", "Chinese (Simplified)"),
            Map.entry("en", "English"),
            Map.entry("pt", "Portuguese"),
            Map.entry("tr", "Turkish"),
            Map.entry("ru", "Russian"),
            Map.entry("uk", "Ukrainian"),
            Map.entry("ro", "Romanian"),
            Map.entry("pl", "Polish"),
            Map.entry("es", "Spanish"),
            Map.entry("kk", "Kazakh"),
            Map.entry("th", "Thai"),
            Map.entry("vi", "Vietnamese"),
            Map.entry("fil", "Filipino"),
            Map.entry("cs", "Czech"),
            Map.entry("hu", "Hungarian"),
            Map.entry("sr", "Serbian"),
            Map.entry("bg", "Bulgarian"),
            Map.entry("az", "Azerbaijani"),
            Map.entry("ka", "Georgian"),
            Map.entry("hy", "Armenian")
    );

    private ResponseLanguage() {
    }

    public static String normalize(String language) {
        if (StrUtil.isBlank(language)) {
            return DEFAULT;
        }
        String code = language.trim().toLowerCase(Locale.ROOT);
        // Accept tags like en-US / zh-CN
        int dash = code.indexOf('-');
        if (dash > 0) {
            code = code.substring(0, dash);
        }
        if ("cn".equals(code)) {
            code = "zh";
        }
        return SUPPORTED.contains(code) ? code : DEFAULT;
    }

    public static boolean isChinese(String language) {
        return "zh".equals(normalize(language));
    }

    public static String displayName(String language) {
        String code = normalize(language);
        return DISPLAY_NAMES.getOrDefault(code, "Chinese (Simplified)");
    }

    /**
     * 追加到系统提示词末尾，强制模型按网站 UI 语言作答。
     */
    public static String appendInstruction(String systemPrompt, String language) {
        String base = StrUtil.nullToEmpty(systemPrompt).trim();
        String instruction = instruction(language);
        if (StrUtil.isBlank(base)) {
            return instruction.trim();
        }
        return base + "\n\n" + instruction;
    }

    public static String instruction(String language) {
        String code = normalize(language);
        String name = displayName(code);
        return """
                # Output language (mandatory)
                The user's website UI language is set to %s (%s).
                You MUST write the entire answer in %s.
                If retrieved documents or tools return content in another language, translate the substance into %s.
                Keep standard SWT English terms as commonly used (e.g. DS-2019, SEVIS, FICA, W-2, sponsor, J-1).
                Do not mix languages unless quoting an unavoidable proper noun or official form name.
                """.formatted(name, code, name, name).trim();
    }

    public static String emptyRetrievalMessage(String language) {
        return switch (normalize(language)) {
            case "zh" -> "未检索到与问题相关的文档内容。";
            case "pt" -> "Não encontrei conteúdo documental relevante para esta pergunta.";
            case "tr" -> "Bu soruyla ilgili belgelerde içerik bulunamadı.";
            case "ru" -> "Не найдено релевантного содержимого документов по этому вопросу.";
            case "uk" -> "Не знайдено релевантного вмісту документів за цим запитанням.";
            case "es" -> "No se encontró contenido documental relevante para esta pregunta.";
            case "vi" -> "Không tìm thấy nội dung tài liệu liên quan đến câu hỏi này.";
            case "th" -> "ไม่พบเนื้อหาเอกสารที่เกี่ยวข้องกับคำถามนี้";
            case "pl" -> "Nie znaleziono treści dokumentów powiązanych z tym pytaniem.";
            case "ro" -> "Nu am găsit conținut relevant în documente pentru această întrebare.";
            default -> "No relevant document content was found for this question.";
        };
    }

    public static String multiQuestionLeadIn(String language) {
        if (isChinese(language)) {
            return "请基于上述文档内容，回答以下问题：\n\n";
        }
        return "Based on the documents above, answer the following questions in "
                + displayName(language) + ":\n\n";
    }
}
