import * as React from "react";

import { RAGENT_API_BASE_URL } from "@/config/runtimeEnv";
import { useChatStore } from "@/stores/chatStore";

type CapabilitiesResponse = {
  webSearch?: boolean;
  webSearchStatus?: "ready" | "missing_key" | "disabled" | string;
  deepThinking?: boolean;
};

let cached: boolean | null = null;
let cachedStatus: string | null = null;
let inflight: Promise<{ available: boolean; status: string | null }> | null = null;

async function fetchWebSearchAvailable(): Promise<{ available: boolean; status: string | null }> {
  const base = RAGENT_API_BASE_URL.replace(/\/$/, "");
  const res = await fetch(`${base}/rag/capabilities?_=${Date.now()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    return { available: false, status: "fetch_failed" };
  }
  const json = (await res.json()) as { code?: string | number; data?: CapabilitiesResponse };
  if (json.code !== "0" && json.code !== 0) {
    return { available: false, status: "api_error" };
  }
  const status = json.data?.webSearchStatus ?? null;
  const available = Boolean(json.data?.webSearch);
  return { available, status };
}

/** 清除能力探测缓存（配置变更后可在控制台调用或刷新页面） */
export function invalidateWebSearchAvailabilityCache() {
  cached = null;
  cachedStatus = null;
  inflight = null;
}

export function useWebSearchAvailable(): boolean {
  const setWebSearchEnabled = useChatStore((s) => s.setWebSearchEnabled);
  const [available, setAvailable] = React.useState(cached ?? false);

  const load = React.useCallback(async (force = false) => {
    if (!force && cached != null) {
      setAvailable(cached);
      if (!cached) {
        setWebSearchEnabled(false);
      }
      return;
    }
    if (!inflight) {
      inflight = fetchWebSearchAvailable()
        .then((result) => {
          cached = result.available;
          cachedStatus = result.status;
          if (process.env.NODE_ENV === "development" && result.status && result.status !== "ready") {
            console.info("[webSearch] capabilities:", result);
          }
          return result;
        })
        .finally(() => {
          inflight = null;
        });
    }
    const result = await inflight;
    setAvailable(result.available);
    if (!result.available) {
      setWebSearchEnabled(false);
    }
  }, [setWebSearchEnabled]);

  React.useEffect(() => {
    void load(false);
  }, [load]);

  React.useEffect(() => {
    const onFocus = () => {
      invalidateWebSearchAvailabilityCache();
      void load(true);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  return available;
}

/** 调试用：最近一次 capabilities 返回的 webSearchStatus */
export function getWebSearchStatusHint(): string | null {
  return cachedStatus;
}

/** @deprecated 使用 useWebSearchAvailable */
export function useDeepThinkingAvailable(): boolean {
  return useWebSearchAvailable();
}
