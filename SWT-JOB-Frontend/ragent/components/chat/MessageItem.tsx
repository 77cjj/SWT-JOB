import * as React from "react";
import { Brain, ChevronDown, FileText } from "lucide-react";

import { FeedbackButtons } from "@/components/chat/FeedbackButtons";
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";
import { ReferralResourceCard, isReferralResource } from "@/components/chat/ReferralResourceCard";
import { ResourcePreviewDrawer } from "@/components/chat/ResourcePreviewDrawer";
import { ThinkingIndicator } from "@/components/chat/ThinkingIndicator";
import { cn } from "@/lib/utils";
import type { Message, MessageResource } from "@/types";
import { useI18n } from "../../../src/context/I18nContext";

interface MessageItemProps {
  message: Message;
  isLast?: boolean;
}

function hasPreviewableResource(item: MessageResource): boolean {
  return Boolean(
    item?.snippet?.trim() ||
      item?.content?.trim() ||
      item?.title?.trim() ||
      item?.url?.trim(),
  );
}

export const MessageItem = React.memo(function MessageItem({ message }: MessageItemProps) {
  const { t, tWithParams } = useI18n();
  const isUser = message.role === "user";
  const isThinking = Boolean(message.isThinking);
  const [thinkingExpanded, setThinkingExpanded] = React.useState(false);
  const [previewResource, setPreviewResource] = React.useState<MessageResource | null>(null);
  const hasThinking = Boolean(message.thinking && message.thinking.trim().length > 0);
  const hasContent = message.content.trim().length > 0;
  const showFeedback =
    message.role === "assistant" &&
    message.status !== "streaming" &&
    message.status !== "error" &&
    Boolean(message.id) &&
    hasContent;
  const resources = (message.resources || []).filter(hasPreviewableResource);
  const referralResources = resources.filter(isReferralResource);
  const docResources = resources.filter((item) => !isReferralResource(item));
  const hasReferralResources = referralResources.length > 0;
  const hasDocResources = docResources.length > 0;
  const isWaiting = message.status === "streaming" && !isThinking && !hasContent;

  if (isUser) {
    return (
      <div className="flex">
        <div className="user-message">
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      </div>
    );
  }

  const thinkingDuration = message.thinkingDuration
    ? tWithParams("chat.seconds", { seconds: message.thinkingDuration })
    : "";
  return (
    <>
      <div className="group flex">
        <div className="min-w-0 flex-1 space-y-4">
          {isThinking ? (
            <ThinkingIndicator content={message.thinking} duration={message.thinkingDuration} />
          ) : null}
          {!isThinking && hasThinking ? (
            <div className="overflow-hidden rounded-lg border border-[#BFDBFE] bg-[#DBEAFE]">
              <button
                type="button"
                onClick={() => setThinkingExpanded((prev) => !prev)}
                className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-[#BFDBFE]/30"
              >
                <div className="flex flex-1 items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#BFDBFE]">
                    <Brain className="h-4 w-4 text-[#2563EB]" />
                  </div>
                  <span className="text-sm font-medium text-[#2563EB]">{t("chat.deepThinking")}</span>
                  {thinkingDuration ? (
                    <span className="rounded-full bg-[#BFDBFE] px-2 py-0.5 text-xs text-[#2563EB]">
                      {thinkingDuration}
                    </span>
                  ) : null}
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-[#3B82F6] transition-transform",
                    thinkingExpanded && "rotate-180"
                  )}
                />
              </button>
              {thinkingExpanded ? (
                <div className="border-t border-[#BFDBFE] px-4 pb-4">
                  <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#1E40AF]">
                    {message.thinking}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="space-y-2">
            {isWaiting ? (
              <div className="ai-wait" aria-label={t("chat.thinking")}>
                <span className="ai-wait-dots" aria-hidden="true">
                  <span className="ai-wait-dot" />
                  <span className="ai-wait-dot" />
                  <span className="ai-wait-dot" />
                </span>
              </div>
            ) : null}
            {hasContent ? <MarkdownRenderer content={message.content} /> : null}
            {hasReferralResources ? (
              <div className="mt-3 space-y-2">
                <div className="text-xs font-semibold tracking-wide text-amber-700 dark:text-amber-300">
                  {t("chat.referralResourcesTitle")}
                </div>
                <div className="grid gap-2 sm:grid-cols-1">
                  {referralResources.map((item, index) => (
                    <ReferralResourceCard
                      key={`referral-${item.dealId ?? item.url ?? item.title}-${index}`}
                      resource={item}
                      onPreview={() => setPreviewResource(item)}
                    />
                  ))}
                </div>
              </div>
            ) : null}
            {hasDocResources ? (
              <div className="mt-3 space-y-2 rounded-xl border border-neutral-200/70 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
                <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  <FileText className="h-3.5 w-3.5" />
                  <span>{t("chat.resourcesTitle")}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {docResources.map((item, index) => (
                    <button
                      key={`${item.chunkId ?? item.docId ?? item.url ?? item.title}-${index}`}
                      type="button"
                      onClick={() => setPreviewResource(item)}
                      className="inline-flex max-w-full items-center rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-left text-xs text-neutral-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/40"
                      title={t("chat.resourcePreviewHint")}
                    >
                      <span className="truncate">{item.title || t("chat.resourceUntitled")}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {message.status === "error" ? (
              <p className="text-xs text-rose-500">{t("chat.generationInterrupted")}</p>
            ) : null}
            {showFeedback ? (
              <FeedbackButtons
                messageId={message.id}
                feedback={message.feedback ?? null}
                content={message.content}
                alwaysVisible
              />
            ) : null}
          </div>
        </div>
      </div>
      <ResourcePreviewDrawer
        open={previewResource != null}
        resource={previewResource}
        onClose={() => setPreviewResource(null)}
      />
    </>
  );
});
