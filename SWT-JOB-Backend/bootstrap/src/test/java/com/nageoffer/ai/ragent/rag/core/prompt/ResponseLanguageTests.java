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

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ResponseLanguageTests {

    @Test
    void normalizeDefaultsAndAcceptsTags() {
        assertEquals("zh", ResponseLanguage.normalize(null));
        assertEquals("zh", ResponseLanguage.normalize(""));
        assertEquals("en", ResponseLanguage.normalize("en-US"));
        assertEquals("zh", ResponseLanguage.normalize("zh-CN"));
        assertEquals("zh", ResponseLanguage.normalize("unknown"));
        assertEquals("pt", ResponseLanguage.normalize("PT"));
    }

    @Test
    void appendInstructionForcesUiLanguage() {
        String prompt = ResponseLanguage.appendInstruction("You are an assistant.", "en");
        assertTrue(prompt.contains("English (en)"));
        assertTrue(prompt.contains("You MUST write the entire answer in English"));
    }

    @Test
    void emptyRetrievalMessageLocalized() {
        assertEquals("未检索到与问题相关的文档内容。", ResponseLanguage.emptyRetrievalMessage("zh"));
        assertEquals("No relevant document content was found for this question.",
                ResponseLanguage.emptyRetrievalMessage("en"));
        assertFalse(ResponseLanguage.isChinese("en"));
    }

    @Test
    void multiQuestionLeadInDoesNotForceEveryAnswerToComeFromDocuments() {
        String leadIn = ResponseLanguage.multiQuestionLeadIn("zh");
        assertTrue(leadIn.contains("通用常识可直接回答"));
        assertFalse(leadIn.contains("基于上述文档内容"));
    }
}
