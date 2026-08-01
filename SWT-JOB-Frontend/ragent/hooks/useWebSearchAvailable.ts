import * as React from "react";

import { RAGENT_API_BASE_URL } from "@/config/runtimeEnv";
import { useChatStore } from "@/stores/chatStore";

type CapabilitiesResponse = {
  webSearch?: boolean;
  deepThinking?: boolean;
};

let cached: boolean | null = null;
let inflight: Promise<boolean> | null = null;

async function fetchWebSearchAvailable(): Promise<boolean> {
  const base = RAGENT_API_BASE_URL.replace(/\/$/, "");
  const res = await fetch(`${base}/rag/capabilities`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    return false;
  }
  const json = (await res.json()) as { code?: string | number; data?: CapabilitiesResponse };
  if (json.code !== "0" && json.code !== 0) {
    return false;
  }
  return Boolean(json.data?.webSearch);
}

export function useWebSearchAvailable(): boolean {
  const setWebSearchEnabled = useChatStore((s) => s.setWebSearchEnabled);
  const [available, setAvailable] = React.useState(cached ?? false);

  React.useEffect(() => {
    if (cached != null) {
      setAvailable(cached);
      if (!cached) {
        setWebSearchEnabled(false);
      }
      return;
    }
    if (!inflight) {
      inflight = fetchWebSearchAvailable()
        .then((value) => {
          cached = value;
          return value;
        })
        .finally(() => {
          inflight = null;
        });
    }
    void inflight.then((value) => {
      setAvailable(value);
      if (!value) {
        setWebSearchEnabled(false);
      }
    });
  }, [setWebSearchEnabled]);

  return available;
}

/** @deprecated 使用 useWebSearchAvailable */
export function useDeepThinkingAvailable(): boolean {
  return useWebSearchAvailable();
}
