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
        String servletPath = normalize(request.getServletPath());
        if (matchesPath(servletPath)) {
            return true;
        }
        String uri = normalize(request.getRequestURI());
        if (uri.contains("/api/ragent")) {
            uri = normalize(uri.substring(uri.indexOf("/api/ragent") + "/api/ragent".length()));
        }
        return matchesPath(uri);
    }

    private static boolean matchesPath(String path) {
        if (StrUtil.isBlank(path)) {
            return false;
        }
        return path.startsWith("/public/")
            || path.equals("/public/site-inquiry")
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
