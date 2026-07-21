"use client";

import * as React from "react";
import { MessageSquare, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { listDemoConversations, type DemoConversation } from "@/services/demoConversationService";
import { useAuthStore } from "@/stores/authStore";

const STATIC_DEMOS: DemoConversation[] = [
  {
    id: "static-1",
    title: "岗位是夯还是拉？",
    description: "网感粗评 offer",
    question: "帮我评一下我的 SWT 岗位是夯还是拉……",
    answer: "（示例）登录并从数据库加载完整对话；部署后请在服务器执行 seed_demo_conversations_zh.sql。",
    pinned: 1,
  },
];

function renderAnswer(text: string) {
  return text.split("\n").map((line, i) => (
    <React.Fragment key={i}>
      {line}
      {i < text.split("\n").length - 1 ? <br /> : null}
    </React.Fragment>
  ));
}

export function DemoConversationsPanel() {
  const [items, setItems] = React.useState<DemoConversation[]>([]);
  const [active, setActive] = React.useState<DemoConversation | null>(null);
  const openLoginDialog = useAuthStore((s) => s.openLoginDialog);

  React.useEffect(() => {
    let ok = true;
    listDemoConversations()
      .then((data) => {
        if (ok && data?.length) setItems(data);
        else if (ok) setItems(STATIC_DEMOS);
      })
      .catch(() => {
        if (ok) setItems(STATIC_DEMOS);
      });
    return () => {
      ok = false;
    };
  }, []);

  if (!items.length && !active) {
    return null;
  }

  if (active) {
    return (
      <div className="mt-8 w-full animate-fade-up">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">示例对话 · 免登录可阅</p>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-900"
            onClick={() => setActive(null)}
          >
            <X className="h-3.5 w-3.5" />
            返回列表
          </button>
        </div>
        <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex justify-end">
            <div className="max-w-[92%] rounded-2xl rounded-br-md bg-indigo-600 px-3 py-2 text-sm text-white">
              {active.question}
            </div>
          </div>
          <div className="flex justify-start">
            <div className="max-w-[92%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-neutral-100 px-3 py-2 text-sm leading-relaxed text-neutral-800 dark:bg-neutral-900 dark:text-neutral-100">
              {renderAnswer(active.answer || "")}
            </div>
          </div>
          <p className="text-center text-xs text-neutral-500">
            以上为运营草拟示例，非实时 AI。想针对你的情况提问？
            <button
              type="button"
              className="ml-1 font-medium text-indigo-600 underline"
              onClick={() => openLoginDialog("登录后即可开始真实 AI 对话")}
            >
              登录继续
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 w-full animate-fade-up">
      <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.24em] text-neutral-400">
        <span className="h-px w-8 bg-neutral-200 dark:bg-neutral-600" />
        示例对话
        <span className="h-px w-8 bg-neutral-200 dark:bg-neutral-600" />
      </div>
      <p className="mt-2 text-center text-xs text-neutral-500">点击可预览问答；登录后可问你的真实情况</p>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActive(item)}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-3 text-left transition hover:border-indigo-300 hover:shadow-sm",
              "border-neutral-200 bg-white/90 dark:border-neutral-800 dark:bg-neutral-950",
              item.pinned ? "ring-1 ring-amber-300/60" : ""
            )}
          >
            <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {item.title || item.question.slice(0, 24)}
                {item.pinned ? (
                  <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">置顶</span>
                ) : null}
              </p>
              {item.description ? (
                <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">{item.description}</p>
              ) : null}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
