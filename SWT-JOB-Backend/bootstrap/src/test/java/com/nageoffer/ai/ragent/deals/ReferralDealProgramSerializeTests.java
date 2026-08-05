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

package com.nageoffer.ai.ragent.deals;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.JsonParser;
import com.nageoffer.ai.ragent.deals.controller.vo.ReferralDealVO;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.Map;

/**
 * 回归：VO.program 必须是 Jackson 可序列化对象，不能是 Gson JsonObject。
 */
class ReferralDealProgramSerializeTests {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void jacksonCannotSerializeGsonJsonObject() {
        Object gsonProgram = JsonParser.parseString("{\"id\":\"kalshi\"}").getAsJsonObject();
        ReferralDealVO vo = ReferralDealVO.builder().id("kalshi").program(gsonProgram).build();
        Assertions.assertThrows(Exception.class, () -> objectMapper.writeValueAsString(vo));
    }

    @Test
    void jacksonCanSerializeMapProgram() throws Exception {
        Object program = objectMapper.readValue("{\"id\":\"kalshi\",\"brandName\":{\"zh\":\"Kalshi\"}}", Map.class);
        ReferralDealVO vo = ReferralDealVO.builder()
                .id("kalshi")
                .program(program)
                .aiEnabled(1)
                .published(1)
                .build();
        String json = objectMapper.writeValueAsString(vo);
        Assertions.assertTrue(json.contains("\"id\":\"kalshi\""));
        Assertions.assertTrue(json.contains("Kalshi"));
    }
}
