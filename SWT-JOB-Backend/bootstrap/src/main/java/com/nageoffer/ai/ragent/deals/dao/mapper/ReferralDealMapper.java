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

package com.nageoffer.ai.ragent.deals.dao.mapper;

import com.baomidou.mybatisplus.annotation.InterceptorIgnore;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.nageoffer.ai.ragent.deals.dao.entity.ReferralDealDO;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

public interface ReferralDealMapper extends BaseMapper<ReferralDealDO> {

    /**
     * 含软删除行（绕过 @TableLogic），用于 upsert / 恢复
     */
    @InterceptorIgnore(blockAttack = "true")
    @Select("""
            SELECT id, site_rebate_usd AS siteRebateUsd, site_rebate_label_zh AS siteRebateLabelZh,
                   site_rebate_label_en AS siteRebateLabelEn, program_json AS programJson,
                   sort_order AS sortOrder, published, ai_enabled AS aiEnabled,
                   create_time AS createTime, update_time AS updateTime, deleted
            FROM t_referral_deal
            WHERE id = #{id}
            LIMIT 1
            """)
    ReferralDealDO selectAnyById(@Param("id") String id);

    /**
     * 恢复软删除并覆盖字段
     */
    @InterceptorIgnore(blockAttack = "true")
    @Update("""
            UPDATE t_referral_deal
            SET site_rebate_usd = #{siteRebateUsd},
                site_rebate_label_zh = #{siteRebateLabelZh},
                site_rebate_label_en = #{siteRebateLabelEn},
                program_json = #{programJson},
                sort_order = #{sortOrder},
                published = #{published},
                ai_enabled = #{aiEnabled},
                deleted = 0,
                update_time = CURRENT_TIMESTAMP
            WHERE id = #{id}
            """)
    int restoreAndUpdate(ReferralDealDO record);
}
