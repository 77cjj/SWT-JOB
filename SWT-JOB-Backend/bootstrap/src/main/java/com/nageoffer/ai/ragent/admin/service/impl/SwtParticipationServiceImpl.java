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

package com.nageoffer.ai.ragent.admin.service.impl;

import com.nageoffer.ai.ragent.admin.controller.vo.SwtParticipationRankItemVO;
import com.nageoffer.ai.ragent.admin.controller.vo.SwtParticipationStatsVO;
import com.nageoffer.ai.ragent.admin.controller.vo.SwtParticipationYearVO;
import com.nageoffer.ai.ragent.admin.service.SwtParticipationService;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * BridgeUSA Summer Work Travel 官方公开统计数据（2024 / 2025）
 */
@Service
public class SwtParticipationServiceImpl implements SwtParticipationService {

    @Override
    public SwtParticipationStatsVO loadStats() {
        return SwtParticipationStatsVO.builder()
                .years(List.of(build2025(), build2024()))
                .build();
    }

    private SwtParticipationYearVO build2025() {
        return SwtParticipationYearVO.builder()
                .year(2025)
                .totalVisitors(104_609)
                .source("2025 New Summer Work Travel Exchange (@workandtravelj1)")
                .sendingCountries(List.of(
                        rank(1, "Jamaica", 8_721),
                        rank(2, "Thailand", 8_275),
                        rank(3, "Mexico", 7_678),
                        rank(4, "Peru", 7_153),
                        rank(5, "Romania", 6_111),
                        rank(6, "Turkey", 5_439),
                        rank(7, "Ecuador", 5_330),
                        rank(8, "Dominican Republic", 4_755),
                        rank(9, "Kazakhstan", 4_527),
                        rank(10, "Argentina", 4_441),
                        rank(11, "Colombia", 3_933),
                        rank(12, "Bulgaria", 3_749),
                        rank(13, "Ireland", 3_582),
                        rank(14, "China", 2_323),
                        rank(15, "Spain", 2_262),
                        rank(16, "Mongolia", 2_097),
                        rank(17, "Brazil", 1_791),
                        rank(18, "Croatia", 1_587),
                        rank(19, "Serbia", 1_378),
                        rank(20, "Poland", 1_272)
                ))
                .usDestinations(List.of(
                        rank(1, "New York", 6_657),
                        rank(2, "Massachusetts", 6_042),
                        rank(3, "Wisconsin", 5_913),
                        rank(4, "Florida", 5_558),
                        rank(5, "Maryland", 5_209),
                        rank(6, "New Jersey", 5_001),
                        rank(7, "Virginia", 4_996),
                        rank(8, "Colorado", 4_592),
                        rank(9, "California", 3_822),
                        rank(10, "Alaska", 3_420),
                        rank(11, "Pennsylvania", 3_372),
                        rank(12, "Ohio", 3_370),
                        rank(13, "Maine", 3_255),
                        rank(14, "South Carolina", 3_003),
                        rank(15, "New Hampshire", 2_912),
                        rank(16, "North Carolina", 2_648),
                        rank(17, "Michigan", 2_607),
                        rank(18, "Tennessee", 2_572),
                        rank(19, "Utah", 2_539),
                        rank(20, "Montana", 2_353)
                ))
                .build();
    }

    private SwtParticipationYearVO build2024() {
        return SwtParticipationYearVO.builder()
                .year(2024)
                .totalVisitors(107_023)
                .source("BridgeUSA: 2024 New Summer Work Travel Exchange (U.S. Department of State)")
                .sendingCountries(List.of(
                        rank(1, "Jamaica", 8_614),
                        rank(2, "Thailand", 7_713),
                        rank(3, "Mexico", 7_490),
                        rank(4, "Peru", 7_112),
                        rank(5, "Romania", 6_114),
                        rank(6, "Turkey", 5_980),
                        rank(7, "Colombia", 5_826),
                        rank(8, "Ecuador", 5_761),
                        rank(9, "Dominican Republic", 5_066),
                        rank(10, "Argentina", 4_692),
                        rank(11, "Ireland", 3_722),
                        rank(12, "Bulgaria", 3_704),
                        rank(13, "Kazakhstan", 3_682),
                        rank(14, "Mongolia", 2_307),
                        rank(15, "Spain", 2_067),
                        rank(16, "China", 1_891),
                        rank(17, "Brazil", 1_886),
                        rank(18, "Chile", 1_812),
                        rank(19, "Croatia", 1_618),
                        rank(20, "Slovakia", 1_417)
                ))
                .usDestinations(List.of(
                        rank(1, "New York", 6_601),
                        rank(2, "Massachusetts", 6_239),
                        rank(3, "Wisconsin", 5_991),
                        rank(4, "Florida", 5_539),
                        rank(5, "Colorado", 5_315),
                        rank(6, "Maryland", 5_093),
                        rank(7, "New Jersey", 5_060),
                        rank(8, "Virginia", 4_830),
                        rank(9, "California", 4_337),
                        rank(10, "Ohio", 3_863),
                        rank(11, "Pennsylvania", 3_398),
                        rank(12, "Maine", 3_378),
                        rank(13, "Arkansas", 3_208),
                        rank(14, "New Hampshire", 2_944),
                        rank(15, "Tennessee", 2_807),
                        rank(16, "South Carolina", 2_736),
                        rank(17, "Utah", 2_700),
                        rank(18, "North Carolina", 2_674),
                        rank(19, "Michigan", 2_594),
                        rank(20, "Montana", 2_356)
                ))
                .build();
    }

    private SwtParticipationRankItemVO rank(int rank, String name, int count) {
        return SwtParticipationRankItemVO.builder()
                .rank(rank)
                .name(name)
                .count(count)
                .build();
    }
}
