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

const rawBypassAuth = process.env.NEXT_PUBLIC_RAGENT_BYPASS_AUTH === "true";
export const RAGENT_BYPASS_AUTH = rawBypassAuth && !isProduction;

const rawAllowLoginPage = process.env.NEXT_PUBLIC_RAGENT_ALLOW_LOGIN_PAGE === "true";
export const RAGENT_ALLOW_LOGIN_PAGE = rawAllowLoginPage && !isProduction;
