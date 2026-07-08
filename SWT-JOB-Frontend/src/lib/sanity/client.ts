import { createClient } from "@sanity/client";

import {
  hasSanityConfig,
  SANITY_API_VERSION,
  SANITY_DATASET,
  SANITY_PROJECT_ID,
  SANITY_READ_TOKEN,
  SANITY_WRITE_TOKEN,
} from "./env";

function createSanityClient({
  token,
  useCdn,
}: {
  token?: string;
  useCdn: boolean;
}) {
  if (!hasSanityConfig()) {
    return null;
  }

  return createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: SANITY_API_VERSION,
    useCdn,
    token,
    perspective: "published",
  });
}

export const sanityReadClient = createSanityClient({
  token: SANITY_READ_TOKEN,
  // 文档读取场景优先速度，使用 CDN 可明显降低首跳等待。
  useCdn: true,
});
export const sanityWriteClient = createSanityClient({
  token: SANITY_WRITE_TOKEN,
  useCdn: false,
});
