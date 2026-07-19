import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ArrowUpRight,
  BookOpen,
  Bot,
  Brain,
  Calculator,
  ChevronDown,
  Gift,
  Lightbulb,
  MapPin,
  Send,
  Square,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { listSampleQuestions } from "@/services/sampleQuestionService";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useI18n } from "../../../src/context/I18nContext";

type PromptPreset = {
  id?: string;
  title: string;
  description: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
};

type GuestFaqItem = {
  id: string;
  question: string;
  answer: string;
};

const PRESET_ICONS = [BookOpen, MapPin, Calculator, Gift];

export function WelcomeScreen() {
  const router = useRouter();
  const { language, t, tWithParams } = useI18n();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const defaultPresets = React.useMemo<PromptPreset[]>(
    () => [
      {
        title: t("chat.presets.cultureTitle"),
        description: t("chat.presets.cultureDescription"),
        prompt: t("chat.presets.culturePrompt"),
        icon: BookOpen
      },
      {
        title: t("chat.presets.destinationTitle"),
        description: t("chat.presets.destinationDescription"),
        prompt: t("chat.presets.destinationPrompt"),
        icon: MapPin
      },
      {
        title: t("chat.presets.wageTitle"),
        description: t("chat.presets.wageDescription"),
        prompt: t("chat.presets.wagePrompt"),
        icon: Calculator
      },
      {
        title: t("chat.presets.dealsTitle"),
        description: t("chat.presets.dealsDescription"),
        prompt: t("chat.presets.dealsPrompt"),
        icon: Gift
      }
    ],
    [t]
  );
  const guestFaqs = React.useMemo<GuestFaqItem[]>(
    () => [
      {
        id: "faq-ssn",
        question: t("chat.guest.faqSsnQ"),
        answer: t("chat.guest.faqSsnA"),
      },
      {
        id: "faq-bank",
        question: t("chat.guest.faqBankQ"),
        answer: t("chat.guest.faqBankA"),
      },
      {
        id: "faq-housing",
        question: t("chat.guest.faqHousingQ"),
        answer: t("chat.guest.faqHousingA"),
      },
      {
        id: "faq-remit",
        question: t("chat.guest.faqRemitQ"),
        answer: t("chat.guest.faqRemitA"),
      },
    ],
    [t]
  );
  const [value, setValue] = React.useState("");
  const [isFocused, setIsFocused] = React.useState(false);
  const [promptPresets, setPromptPresets] = React.useState<PromptPreset[]>(defaultPresets);
  const [openFaqId, setOpenFaqId] = React.useState<string | null>(guestFaqs[0]?.id ?? null);
  const isComposingRef = React.useRef(false);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const { sendMessage, isStreaming, cancelGeneration, deepThinkingEnabled, setDeepThinkingEnabled } =
    useChatStore();

  const quotaRemaining = user?.aiQuotaRemaining;
  const quotaTotal = user?.aiQuotaTotal;
  const showQuota =
    isAuthenticated &&
    typeof quotaRemaining === "number" &&
    typeof quotaTotal === "number";
  const quotaExhausted = showQuota && quotaRemaining <= 0;

  const focusInput = React.useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.focus({ preventScroll: true });
  }, []);

  const adjustHeight = React.useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, 160);
    el.style.height = `${next}px`;
  }, []);

  React.useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  React.useEffect(() => {
    let active = true;
    setPromptPresets(defaultPresets);

    const loadPresets = async () => {
      const data = await listSampleQuestions().catch(() => null);
      if (!active || !data || data.length === 0) {
        return;
      }
      const mapped = data
        .filter((item) => item.question && item.question.trim())
        .slice(0, 3)
        .map((item, index) => {
          const question = item.question.trim();
          const title =
            item.title?.trim() ||
            (question.length > 12 ? `${question.slice(0, 12)}...` : question) ||
            tWithParams("chat.presets.fallbackTitle", { index: index + 1 });
          const description = item.description?.trim() || t("chat.presets.fallbackDescription");
          return {
            id: item.id,
            title,
            description,
            prompt: question,
            icon: PRESET_ICONS[index % PRESET_ICONS.length]
          };
        });
      if (mapped.length > 0) {
        setPromptPresets(mapped);
      }
    };

    // 中文优先用后台示例问题；英文保留内置预设，但仍尝试公开接口
    if (language === "zh" || !isAuthenticated) {
      loadPresets();
    }
    return () => {
      active = false;
    };
  }, [defaultPresets, language, t, tWithParams, isAuthenticated]);

  const requireLogin = React.useCallback(() => {
    toast.info(t("chat.guest.loginToAsk"));
    void router.push("/login");
  }, [router, t]);

  const applyPreset = React.useCallback(
    (prompt: string) => {
      if (isStreaming) return;
      if (!isAuthenticated) {
        requireLogin();
        return;
      }
      if (quotaExhausted) {
        toast.info(t("chat.quotaExhausted"));
        void router.push("/pricing");
        return;
      }
      setValue(prompt);
      focusInput();
    },
    [isStreaming, isAuthenticated, requireLogin, quotaExhausted, router, t, focusInput]
  );

  const handleSubmit = async () => {
    if (isStreaming) {
      cancelGeneration();
      focusInput();
      return;
    }
    if (!value.trim()) return;
    if (!isAuthenticated) {
      requireLogin();
      return;
    }
    if (quotaExhausted) {
      toast.info(t("chat.quotaExhausted"));
      void router.push("/pricing");
      return;
    }
    const next = value;
    setValue("");
    focusInput();
    await sendMessage(next);
    focusInput();
  };

  const hasContent = value.trim().length > 0;

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center overflow-y-auto overflow-x-hidden bg-white px-4 py-10 dark:bg-neutral-950 sm:px-6">
      <div className="relative w-full max-w-[860px]">
        <div className="animate-fade-up text-center" style={{ animationFillMode: "both" }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200/90 bg-white/90 px-3 py-1 text-xs font-medium text-indigo-600 shadow-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-indigo-400">
            <Bot className="h-3.5 w-3.5" />
            {t("chat.badge")}
          </span>
          <h1 className="mt-4 font-display text-4xl leading-tight tracking-tight text-neutral-900 sm:text-5xl md:text-6xl dark:text-neutral-50">
            {t("chat.headlinePrefix")}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
              {t("chat.headlineHighlight")}
            </span>
          </h1>
          <p className="mt-4 text-base text-neutral-600 sm:text-lg dark:text-neutral-400">
            {isAuthenticated ? t("chat.subtitle") : t("chat.guest.subtitle")}
          </p>
          {!isAuthenticated ? (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Link
                href="/login"
                className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                {t("common.login")}
              </Link>
              <Link
                href="/register"
                className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:border-indigo-300 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200"
              >
                {t("common.register")}
              </Link>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {t("chat.guest.freeQuotaHint")}
              </span>
            </div>
          ) : showQuota ? (
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
              {quotaExhausted
                ? t("chat.quotaExhausted")
                : tWithParams("chat.quotaRemaining", {
                    remaining: quotaRemaining,
                    total: quotaTotal,
                  })}
              {quotaExhausted ? (
                <>
                  {" · "}
                  <Link href="/pricing" className="text-indigo-600 hover:underline dark:text-indigo-400">
                    {t("chat.viewPricing")}
                  </Link>
                </>
              ) : null}
            </p>
          ) : null}
        </div>

        {!isAuthenticated ? (
          <div className="mt-10 animate-fade-up space-y-3" style={{ animationDelay: "80ms", animationFillMode: "both" }}>
            <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.24em] text-neutral-400 dark:text-neutral-500">
              <span className="h-px w-8 bg-neutral-200 dark:bg-neutral-600" />
              {t("chat.guest.faqTitle")}
              <span className="h-px w-8 bg-neutral-200 dark:bg-neutral-600" />
            </div>
            {guestFaqs.map((item) => {
              const open = openFaqId === item.id;
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-neutral-200/90 bg-white/95 text-left shadow-sm dark:border-neutral-700 dark:bg-neutral-950"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(open ? null : item.id)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  >
                    <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-neutral-400 transition-transform",
                        open && "rotate-180"
                      )}
                    />
                  </button>
                  {open ? (
                    <div className="border-t border-neutral-100 px-4 py-3 text-sm leading-relaxed text-neutral-600 dark:border-neutral-800 dark:text-neutral-300">
                      {item.answer}
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={requireLogin}
                          className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          {t("chat.guest.askAiCta")}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="mt-10 animate-fade-up" style={{ animationDelay: "80ms", animationFillMode: "both" }}>
          <div
            className={cn(
              "relative flex flex-col rounded-3xl border px-5 pt-4 pb-3 shadow-sm backdrop-blur-xl transition-all duration-200",
              "border-neutral-200/90 bg-white/95 dark:border-neutral-700 dark:bg-neutral-950",
              isFocused
                ? "border-indigo-300 shadow-md ring-1 ring-indigo-500/20 dark:border-indigo-500/50 dark:ring-indigo-400/20"
                : "hover:border-neutral-300 dark:hover:border-neutral-500"
            )}
          >
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={
                  !isAuthenticated
                    ? t("chat.guest.inputPlaceholder")
                    : deepThinkingEnabled
                      ? t("chat.deepInputPlaceholder")
                      : t("chat.inputPlaceholder")
                }
                className="max-h-40 min-h-[52px] w-full resize-none border-0 bg-transparent px-2 pt-2 pb-2 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none sm:text-base dark:text-neutral-100 dark:placeholder:text-neutral-500"
                rows={1}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onCompositionStart={() => {
                  isComposingRef.current = true;
                }}
                onCompositionEnd={() => {
                  isComposingRef.current = false;
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    const nativeEvent = event.nativeEvent as KeyboardEvent;
                    if (nativeEvent.isComposing || isComposingRef.current || nativeEvent.keyCode === 229) {
                      return;
                    }
                    event.preventDefault();
                    handleSubmit();
                  }
                }}
                aria-label={t("chat.sendMessage")}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setDeepThinkingEnabled(!deepThinkingEnabled)}
                disabled={isStreaming || !isAuthenticated}
                aria-pressed={deepThinkingEnabled}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                  deepThinkingEnabled
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/50 dark:bg-indigo-950/80 dark:text-indigo-300"
                    : "border-transparent bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900",
                  (isStreaming || !isAuthenticated) && "cursor-not-allowed opacity-60"
                )}
              >
                <span className="inline-flex items-center gap-2">
                  <Brain className={cn("h-3.5 w-3.5", deepThinkingEnabled && "text-indigo-600 dark:text-indigo-400")} />
                  {t("chat.deepThinking")}
                  {deepThinkingEnabled ? (
                    <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse dark:bg-indigo-400" />
                  ) : null}
                </span>
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!hasContent && !isStreaming}
                aria-label={isStreaming ? t("chat.stopGeneration") : t("chat.sendMessage")}
                className={cn(
                  "ml-auto inline-flex items-center justify-center rounded-full p-2.5 transition-all duration-200",
                  isStreaming
                    ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-950/80 dark:text-red-400 dark:hover:bg-red-900/80"
                    : hasContent
                      ? "bg-indigo-600 text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                      : "cursor-not-allowed bg-neutral-200 text-neutral-400 dark:bg-neutral-700 dark:text-neutral-500"
                )}
              >
                {isStreaming ? <Square className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {deepThinkingEnabled && isAuthenticated ? (
            <p className="mt-3 text-xs text-indigo-700 dark:text-indigo-400">
              <span className="inline-flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5" />
                {t("chat.deepThinkingOn")}
              </span>
            </p>
          ) : null}
        </div>

        <div className="mt-10 animate-fade-up" style={{ animationDelay: "160ms", animationFillMode: "both" }}>
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.24em] text-neutral-400 dark:text-neutral-500">
            <span className="h-px w-8 bg-neutral-200 dark:bg-neutral-600" />
            {isAuthenticated ? t("chat.startFrom") : t("chat.guest.samplePrompts")}
            <span className="h-px w-8 bg-neutral-200 dark:bg-neutral-600" />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {promptPresets.map((preset) => {
              const Icon = preset.icon;
              return (
                <button
                  key={preset.id ?? preset.title}
                  type="button"
                  onClick={() => applyPreset(preset.prompt)}
                  disabled={isStreaming}
                  className={cn(
                    "group rounded-2xl border p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                    "border-neutral-200/90 bg-white/90 hover:border-indigo-300 dark:border-neutral-700 dark:bg-neutral-950 dark:hover:border-indigo-500/50",
                    isStreaming && "cursor-not-allowed opacity-60"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{preset.title}</p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">{preset.description}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                    <span className="min-w-0 flex-1 truncate">
                      {tWithParams("chat.recommendedPrompt", { prompt: preset.prompt })}
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-neutral-400 transition-colors group-hover:text-indigo-500 dark:text-neutral-500 dark:group-hover:text-indigo-400" />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">
              {t("chat.quickLinks")}
            </span>
            {[
              { href: "/deals", label: t("chat.quickDeals") },
              { href: "/jobs", label: t("chat.quickJobs") },
              { href: "/docs/apply/timeline", label: t("chat.quickJourney") },
              { href: "/docs", label: t("chat.quickDocs") },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:border-indigo-500/50 dark:hover:text-indigo-400"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
