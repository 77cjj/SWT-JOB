import type { NextApiRequest, NextApiResponse } from "next";

import { STATIC_DEMO_CONVERSATIONS } from "../../../ragent/lib/demoConversations";

type ApiResult = {
  code?: string;
  data?: unknown;
};

/** 访客示例对话：先短超时打后端，失败则返回内置数据，避免 Vercel→阿里云 502 直接暴露给浏览器 */
export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const apiBase = (process.env.NEXT_PUBLIC_RAGENT_API_BASE_URL || "").trim().replace(/\/$/, "");

  if (apiBase) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const upstream = await fetch(`${apiBase}/rag/demo-conversations`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timer);
      if (upstream.ok) {
        const payload = (await upstream.json()) as ApiResult;
        if (payload?.code === "0" && Array.isArray(payload.data) && payload.data.length > 0) {
          res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=600");
          res.status(200).json(payload.data);
          return;
        }
      }
    } catch {
      // fall through
    }
  }

  res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
  res.status(200).json(
    STATIC_DEMO_CONVERSATIONS.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      question: item.question,
      answer: item.answer,
      sortOrder: item.sortOrder,
      pinned: item.pinned,
    })),
  );
}
