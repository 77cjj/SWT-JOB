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

import cn.hutool.core.util.StrUtil;
import jakarta.servlet.http.HttpServletRequest;

/**
 * 无需登录的公开 API（Webhook、公开读接口等）。
 */
public final class PublicAnonymousPathMatcher {

    private PublicAnonymousPathMatcher() {}

    public static boolean matches(HttpServletRequest request) {
        if (request == null) {
            return false;
        }
        return matchesPath(pathWithinApplication(request));
    }

    /** Spring context-path 下的路径，例如 /public/site-inquiry */
    static String pathWithinApplication(HttpServletRequest request) {
        String uri = normalize(request.getRequestURI());
        String ctx = normalize(request.getContextPath());
        if (StrUtil.isNotBlank(ctx) && uri.startsWith(ctx)) {
            uri = normalize(uri.substring(ctx.length()));
        }
        if (StrUtil.isNotBlank(uri)) {
            return uri;
        }
        String servletPath = normalize(request.getServletPath());
        String pathInfo = normalize(request.getPathInfo());
        if (StrUtil.isBlank(pathInfo)) {
            return servletPath;
        }
        if (StrUtil.isBlank(servletPath) || "/".equals(servletPath)) {
            return normalize(pathInfo);
        }
        return normalize(servletPath + pathInfo);
    }

    private static boolean matchesPath(String path) {
        if (StrUtil.isBlank(path)) {
            return false;
        }
        return path.equals("/auth/site-inquiry-webhook")
            || path.equals("/auth/site-inquiry-ping")
            || path.equals("/public/site-inquiry-ping")
            || path.startsWith("/public/")
            || path.startsWith("/referral-deals/public")
            || path.startsWith("/auth/")
            || path.equals("/rag/sample-questions")
            || path.equals("/rag/demo-conversations")
            || path.equals("/rag/capabilities");
    }

    private static String normalize(String path) {
        if (path == null) {
            return "";
        }
        String p = path.trim();
        if (p.length() > 1 && p.endsWith("/")) {
            p = p.substring(0, p.length() - 1);
        }
        return p;
    }
}
