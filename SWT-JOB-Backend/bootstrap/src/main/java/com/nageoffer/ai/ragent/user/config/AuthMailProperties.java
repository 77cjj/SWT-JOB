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

package com.nageoffer.ai.ragent.user.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 找回密码邮件：配置 RESEND_API_KEY 或 SMTP 后才真正发信。
 * 未配置时接口仍返回成功文案，引导用户联系站长。
 */
@Data
@ConfigurationProperties(prefix = "auth.mail")
public class AuthMailProperties {

    /** Resend API Key；非空即视为已配置邮件 */
    private String resendApiKey = "";

    /** 发件人，如 SWT Helper <noreply@example.com> */
    private String from = "";
}
