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

package com.nageoffer.ai.ragent.compare.controller.request;

import lombok.Data;

import java.math.BigDecimal;
import java.util.Map;

@Data
public class CompareJobSubmitRequest {

    /** 前端本地 jobId，可选 */
    private String jobId;

    private String jobTitle;

    private String company;

    private String state;

    private BigDecimal hourlyWage;

    private BigDecimal avgHoursPerWeek;

    private Boolean tipped;

    private BigDecimal averageTip;

    private Boolean hasHousing;

    private BigDecimal housingCostPerWeek;

    private BigDecimal secondJobHours;

    private BigDecimal secondJobHourlyWage;

    private String projectStartDate;

    private String projectEndDate;

    /** 额外字段快照（仅允许简单标量，服务端会再过滤） */
    private Map<String, Object> extras;

    private String source;
}
