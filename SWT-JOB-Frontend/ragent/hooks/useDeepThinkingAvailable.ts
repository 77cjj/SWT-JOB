import * as React from "react";

import { RAGENT_API_BASE_URL } from "@/config/runtimeEnv";
import { useChatStore } from "@/stores/chatStore";

type CapabilitiesResponse = {
  deepThinking?: boolean;
};

let cached: boolean | null = null;
let inflight: Promise<boolean> | null = null;

async function fetchDeepThinkingAvailable(): Promise<boolean> {
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
  return Boolean(json.data?.deepThinking);
}

export function useDeepThinkingAvailable(): boolean {
  const setDeepThinkingEnabled = useChatStore((s) => s.setDeepThinkingEnabled);
  const [available, setAvailable] = React.useState(cached ?? false);

  React.useEffect(() => {
    if (cached != null) {
      setAvailable(cached);
      if (!cached) {
        setDeepThinkingEnabled(false);
      }
      return;
    }
    if (!inflight) {
      inflight = fetchDeepThinkingAvailable()
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
        setDeepThinkingEnabled(false);
      }
    });
  }, [setDeepThinkingEnabled]);

  return available;
}
