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
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center overflow-y-auto overflow-x-hidden bg-white px-4 py-10 dark:bg-neutral-950 sm:px-6">
      <div className="relative w-full max-w-[860px]">
        <div className="animate-fade-up text-center" style={{ animationFillMode: "both" }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200/90 bg-white/90 px-3 py-1 text-xs font-medium text-indigo-600 shadow-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-indigo-400">
            <Bot className="h-3.5 w-3.5" />
            SWT 赴美实习 · 智能问答
          </span>
          <h1 className="mt-4 font-display text-4xl leading-tight tracking-tight text-neutral-900 sm:text-5xl md:text-6xl dark:text-neutral-50">
            从文化到薪资，
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
              问清每一步
            </span>
          </h1>
          <p className="mt-4 text-base text-neutral-600 sm:text-lg dark:text-neutral-400">
            美国职场与文化、目的地州与生活、行前适应与工时薪资——结合项目文档，把问题变成你能用的参考与行动点
          </p>
        </div>

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
                placeholder={deepThinkingEnabled ? "输入需要深度分析的问题..." : "输入你的问题..."}
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
                aria-label="发送消息"
              />
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
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/50 dark:bg-indigo-950/80 dark:text-indigo-300"
                    : "border-transparent bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900",
                  isStreaming && "cursor-not-allowed opacity-60"
                )}
              >
                <span className="inline-flex items-center gap-2">
                  <Brain className={cn("h-3.5 w-3.5", deepThinkingEnabled && "text-indigo-600 dark:text-indigo-400")} />
                  深度思考
                  {deepThinkingEnabled ? (
                    <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse dark:bg-indigo-400" />
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
          {deepThinkingEnabled ? (
            <p className="mt-3 text-xs text-indigo-700 dark:text-indigo-400">
              <span className="inline-flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5" />
                深度思考模式已开启，AI将进行更深入的分析推理
              </span>
            </p>
          ) : null}
        </div>

        <div className="mt-10 animate-fade-up" style={{ animationDelay: "160ms", animationFillMode: "both" }}>
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.24em] text-neutral-400 dark:text-neutral-500">
            <span className="h-px w-8 bg-neutral-200 dark:bg-neutral-600" />
            从这些 SWT 话题开始
            <span className="h-px w-8 bg-neutral-200 dark:bg-neutral-600" />
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
                    <span className="min-w-0 flex-1 truncate">推荐问法：{preset.prompt}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-neutral-400 transition-colors group-hover:text-indigo-500 dark:text-neutral-500 dark:group-hover:text-indigo-400" />
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
