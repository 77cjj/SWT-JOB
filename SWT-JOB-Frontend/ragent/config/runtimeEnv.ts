const NODE_ENV = process.env.NODE_ENV || "development";
const isProduction = NODE_ENV === "production";

const rawApiBaseUrl =
  process.env.NEXT_PUBLIC_RAGENT_API_BASE_URL || "";

const fallbackApiBaseUrl = "https://ragent.nageoffer.com";

function normalizeBaseUrl(url: string) {
  return url.trim().replace(/\/$/, "");
}

function resolveApiBaseUrl() {
  const configured = normalizeBaseUrl(rawApiBaseUrl);
  if (configured) return configured;
  if (!isProduction) return fallbackApiBaseUrl;
  throw new Error(
    "缺少 NEXT_PUBLIC_RAGENT_API_BASE_URL：生产环境必须显式配置 Ragent API 地址。"
  );
}

export const RAGENT_API_BASE_URL = resolveApiBaseUrl();

export const GOOGLE_CLIENT_ID = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "").trim();

export const APPLE_CLIENT_ID = (process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || "").trim();

export const WECHAT_APP_ID = (process.env.NEXT_PUBLIC_WECHAT_APP_ID || "").trim();

/**
 * 第三方登录（Google / Apple / 微信）总开关。
 * - 显式 true / false 时按配置
 * - 未配置时：只要配了任一 Client ID 就默认开启（避免 Vercel 漏配开关导致 Google 按钮消失）
 */
const oauthLoginFlag = (process.env.NEXT_PUBLIC_ENABLE_OAUTH_LOGIN || "").trim().toLowerCase();
export const ENABLE_OAUTH_LOGIN =
  oauthLoginFlag === "true" ||
  (oauthLoginFlag !== "false" &&
    Boolean(GOOGLE_CLIENT_ID || APPLE_CLIENT_ID || WECHAT_APP_ID));

const rawBypassAuth = process.env.NEXT_PUBLIC_RAGENT_BYPASS_AUTH === "true";
export const RAGENT_BYPASS_AUTH = rawBypassAuth && !isProduction;

const rawAllowLoginPage = process.env.NEXT_PUBLIC_RAGENT_ALLOW_LOGIN_PAGE === "true";
export const RAGENT_ALLOW_LOGIN_PAGE = rawAllowLoginPage && !isProduction;
