import * as React from "react";
import { ArrowUpRight, BookOpen, Bot, Brain, Calculator, Lightbulb, MapPin, Send, Square } from "lucide-react";

import { cn } from "@/lib/utils";
import { listSampleQuestions } from "@/services/sampleQuestionService";
import { useChatStore } from "@/stores/chatStore";

type PromptPreset = {
  id?: string;
  title: string;
  description: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
};

const PRESET_ICONS = [BookOpen, MapPin, Calculator];

const DEFAULT_PRESETS: PromptPreset[] = [
  {
    title: "美国文化与职场常识",
    description: "沟通方式、小费、边界感与常见误区，更快融入 SWT 日常",
    prompt:
      "我是即将参加 SWT（赴美暑期打工/实习）项目的学生。请用条目说明：美国职场与日常生活中值得注意的文化差异（含沟通、时间观念、小费、个人边界等），并给我 6 条可立刻执行的建议。",
    icon: BookOpen
  },
  {
    title: "目的地州与文化",
    description: "按州/城市了解气候、消费、交通与本地习惯，行前更有数",
    prompt:
      "我的 SWT 目的地是【请填写州名或城市，例如 California / Orlando, FL】。请简要介绍该州/地区的气候与季节、大致生活成本与交通方式、安全与本地文化特点，并列出 5 条「落地后更好适应」的实用提示。",
    icon: MapPin
  },
  {
    title: "薪资与工时（自然语言估算）",
    description: "用口语描述岗位、工时与时薪，粗算周薪与需注意的扣款项（仅供参考）",
    prompt:
      "请根据 SWT 常见用工场景，用自然语言帮我做「仅供参考」的粗算：我在【岗位类型，如餐饮前台/游乐园操作员】、每周大约【X】小时、税前时薪【Y】美元、是否含小费【是/否】。请估算大致周薪区间，并提醒需要与雇主合同、工资单或官方说明核对的项目（如预扣税、住宿扣款等）。下面是我的具体情况：",
    icon: Calculator
  }
];

export function WelcomeScreen() {
  const [value, setValue] = React.useState("");
  const [isFocused, setIsFocused] = React.useState(false);
  const [promptPresets, setPromptPresets] = React.useState<PromptPreset[]>(DEFAULT_PRESETS);
  const isComposingRef = React.useRef(false);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const { sendMessage, isStreaming, cancelGeneration, deepThinkingEnabled, setDeepThinkingEnabled } =
    useChatStore();

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
            `推荐问法 ${index + 1}`;
          const description = item.description?.trim() || "直接点选即可开始对话";
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

    loadPresets();
    return () => {
      active = false;
    };
  }, []);

  const applyPreset = React.useCallback(
    (prompt: string) => {
      if (isStreaming) return;
      setValue(prompt);
      focusInput();
    },
    [isStreaming, focusInput]
  );

  const handleSubmit = async () => {
    if (isStreaming) {
      cancelGeneration();
      focusInput();
      return;
    }
    if (!value.trim()) return;
    const next = value;
    setValue("");
    focusInput();
    await sendMessage(next);
    focusInput();
  };

  const hasContent = value.trim().length > 0;

  return (
    <div className="relative flex min-h-full items-center justify-center overflow-hidden bg-white px-4 py-16 dark:bg-neutral-950 sm:px-6">
      <div className="relative w-full max-w-[860px]">
        <div
          className="text-center opacity-0 animate-fade-up"
          style={{ animationFillMode: "both" }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-medium text-[#2563EB] shadow-sm">
            <Bot className="h-3.5 w-3.5" />
            SWT 赴美实习 · 智能问答
          </span>
          <h1 className="mt-4 font-display text-4xl leading-tight tracking-tight text-[#111827] sm:text-5xl md:text-6xl">
            从文化到薪资，
            <span className="text-gradient">问清每一步</span>
          </h1>
          <p className="mt-4 text-base text-[#4B5563] sm:text-lg">
            美国职场与文化、目的地州与生活、行前适应与工时薪资——结合项目文档，把问题变成你能用的参考与行动点
          </p>
        </div>

        <div
          className="mt-10 opacity-0 animate-fade-up"
          style={{ animationDelay: "80ms", animationFillMode: "both" }}
        >
          <div
            className={cn(
              "relative flex flex-col rounded-3xl border border-white/70 bg-white/80 px-5 pt-4 pb-3 shadow-soft backdrop-blur-xl transition-all duration-200",
              isFocused
                ? "border-[#BFDBFE] shadow-glow"
                : "hover:border-[#D4D4D4]"
            )}
          >
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={deepThinkingEnabled ? "输入需要深度分析的问题..." : "输入你的问题..."}
                className="max-h-40 min-h-[52px] w-full resize-none border-0 bg-transparent px-2 pt-2 pb-2 text-[15px] text-[#1F2937] placeholder:text-[#9CA3AF] focus:outline-none sm:text-base"
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
                aria-label="发送消息"
              />
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[10px] bg-gradient-to-b from-white/0 via-white/40 to-white/90" />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setDeepThinkingEnabled(!deepThinkingEnabled)}
                disabled={isStreaming}
                aria-pressed={deepThinkingEnabled}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                  deepThinkingEnabled
                    ? "border-[#BFDBFE] bg-[#DBEAFE] text-[#2563EB]"
                    : "border-transparent bg-[#F5F5F5] text-[#6B7280] hover:bg-[#EEEEEE]",
                  isStreaming && "cursor-not-allowed opacity-60"
                )}
              >
                <span className="inline-flex items-center gap-2">
                  <Brain className={cn("h-3.5 w-3.5", deepThinkingEnabled && "text-[#3B82F6]")} />
                  深度思考
                  {deepThinkingEnabled ? (
                    <span className="h-2 w-2 rounded-full bg-[#3B82F6] animate-pulse" />
                  ) : null}
                </span>
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!hasContent && !isStreaming}
                aria-label={isStreaming ? "停止生成" : "发送消息"}
                className={cn(
                  "ml-auto inline-flex items-center justify-center rounded-full p-2.5 transition-all duration-200",
                  isStreaming
                    ? "bg-[#FEE2E2] text-[#EF4444] hover:bg-[#FECACA]"
                    : hasContent
                      ? "bg-[#3B82F6] text-white hover:bg-[#2563EB]"
                      : "cursor-not-allowed bg-[#F5F5F5] text-[#CCCCCC]"
                )}
              >
                {isStreaming ? <Square className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {deepThinkingEnabled ? (
            <p className="mt-3 text-xs text-[#2563EB]">
              <span className="inline-flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5" />
                深度思考模式已开启，AI将进行更深入的分析推理
              </span>
            </p>
          ) : null}
          <p className="mt-3 text-center text-xs text-[#94A3B8]">
            <kbd className="rounded bg-white/80 px-1.5 py-0.5 text-[#6B7280] shadow-sm">
              Enter
            </kbd>{" "}
            发送
            <span className="px-1.5">·</span>
            <kbd className="rounded bg-white/80 px-1.5 py-0.5 text-[#6B7280] shadow-sm">
              Shift + Enter
            </kbd>{" "}
            换行
            {isStreaming ? <span className="ml-2 animate-pulse-soft">生成中...</span> : null}
          </p>
        </div>

        <div
          className="mt-10 opacity-0 animate-fade-up"
          style={{ animationDelay: "160ms", animationFillMode: "both" }}
        >
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.24em] text-[#94A3B8]">
            <span className="h-px w-8 bg-[#E5E7EB]" />
            从这些 SWT 话题开始
            <span className="h-px w-8 bg-[#E5E7EB]" />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {promptPresets.map((preset) => {
              const Icon = preset.icon;
              return (
                <button
                  key={preset.id ?? preset.title}
                  type="button"
                  onClick={() => applyPreset(preset.prompt)}
                  disabled={isStreaming}
                  className={cn(
                    "group rounded-2xl border border-white/70 bg-white/70 p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#BFDBFE] hover:shadow-md",
                    isStreaming && "cursor-not-allowed opacity-60"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#1F2937]">{preset.title}</p>
                      <p className="text-xs text-[#6B7280]">{preset.description}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-[#94A3B8]">
                    <span className="min-w-0 flex-1 truncate">推荐问法：{preset.prompt}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-[#CBD5F5] transition-colors group-hover:text-[#3B82F6]" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
