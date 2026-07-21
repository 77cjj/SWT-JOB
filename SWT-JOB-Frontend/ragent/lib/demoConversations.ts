import type { DemoConversation } from "@/services/demoConversationService";
import { listDemoConversations } from "@/services/demoConversationService";
import type { Message, Session } from "@/types";

export const DEMO_SESSION_PREFIX = "demo-";

/** 与 seed_demo_conversations_zh.sql 对齐；API 不可用时兜底 */
export const STATIC_DEMO_CONVERSATIONS: DemoConversation[] = [
  {
    id: "9100000000000000001",
    title: "岗位是夯还是拉？",
    description: "网感粗评 + 引导计算器",
    question:
      "我在纠结两个 SWT offer：A 是佛罗里达游乐园餐饮 $14/h 包住宿但通勤远；B 是加州前台 $17/h 不包住宿。帮我用「夯 / NPC / 拉」评一下，并教我怎么用选岗计算器算净收入。",
    answer:
      "**结论先说：**A 更像「能存下钱但生活半径小」的 NPC～夯之间；B 时薪好看但加州租屋会把净收入打回去，容易变 NPC 或拉，取决于你每周工时和小费。\n\n**维度粗评：**\n- **时薪：**B 表面赢，但要看合同 guaranteed hours。\n- **住宿：**A 包住宿通常是 SWT 存钱的 MVP；B 要自己算 $/周 rent。\n- **小费：**餐饮前台若在高流量园区，小费可能把 A 拉向「夯」。\n- **合规：**两 offer 都要确认 SEVIS 雇主信息一致。\n\n**下一步：**打开站内 **选岗计算器**，把 hourly、hours、rent、state tax 填进去对比 3 个场景；需要我根据你填的数字再算一版，登录后直接发我表单截图或数字即可。",
    sortOrder: 0,
    pinned: 1,
  },
  {
    id: "9100000000000000002",
    title: "行前 4 周要做什么？",
    description: "签证·保险·行李",
    question: "离出发还有 4 周，SWT 行前最该先搞定哪 5 件事？请按优先级排序。",
    answer:
      "1. **护照/签证/SEVIS 状态**——确认 I-20/DS-2019 信息、evidence of funds 与入境时间窗口。\n2. **保险**——按 sponsor 要求买满项目期；保存英文保单 PDF。\n3. **资金与信用卡**——带少量现金 + 至少一张能在美国用的卡；了解 first-week 预算。\n4. **行李与禁带品**——查 TSA/航司；常带转接头、常用药（保留原包装与英文说明）。\n5. **落地联系链**——雇主/sponsor/室友的 WhatsApp 或电话；保存 offline。\n\n更完整清单见 **SWT 文档 → 行前**；有具体 sponsor 名字我可以帮你对表。",
    sortOrder: 1,
    pinned: 0,
  },
  {
    id: "9100000000000000003",
    title: "SWT 回国怎么退税？",
    description: "W-2 与离境时间线",
    question: "项目结束了，我手里有 W-2，人还在美国，什么时候、怎么开始退税流程？",
    answer:
      "**一般时间线（非税务建议）：**\n- 收到 **W-2** 后核对 employer EIN、工资与预扣税。\n- 多数情况下需按 **非居民/居民身份** 判断表格（如 1040-NR vs 1040）；SWT 学生常见情况较复杂，**别用 TurboTax 盲填**。\n- 若已离境，仍可在截止日前 **mail/e-file**（视身份与软件支持而定）。\n\n**材料：**W-2、I-94、护照、previous returns、state return（若有）。\n\n**建议：**简单 case 可用 CRA/CPA；复杂 case 找熟悉 **NRA** 的 CPA。站内文档 **归国 → 税务** 有概念梳理；需要我根据你的 visa 类型列 checklist，登录后发我 W-2 Box 字段（打码）。",
    sortOrder: 2,
    pinned: 0,
  },
  {
    id: "9100000000000000004",
    title: "低门槛银行开户有哪些？",
    description: "少存钱的 checking 奖励",
    question:
      "我没有很多存款，SWT 期间想开 checking 拿开户奖励，有哪些通常 DD 要求比较低、线上能办的？",
    answer:
      "**思路：**优先看 **checking/savings 开户 bonus** 里 DD 门槛 $500–$1000 档、可 **online funding** 的账户；F-1/SWT 常有 **无 SSN 先开、后到 SSN 补** 的路径，但 **以银行 KYC 为准**。\n\n**常见类型（会变动，以官网为准）：**\n- 线上 neobank / fintech（如 Chime 类）——常配合 refer；注意 DD 定义。\n- 部分 credit union——有时有 local bonus，但可能要地址证明。\n\n**别踩坑：**奖励 taxable；关闭账户可能 clawback；**不要**为了 bonus 开太多户影响 ChexSystems。\n\n详见站内新文档 **《低存款门槛银行开户奖励》** 和 **薅羊毛** 页；有 SSN/无 SSN 情况不同，可以登录补充我再帮你缩名单。",
    sortOrder: 3,
    pinned: 0,
  },
  {
    id: "9100000000000000005",
    title: "Kalshi refer 怎么领？",
    description: "预测 + 加密成交量",
    question: "Kalshi 用邀请注册后，预测市场和加密市场分别要交易多少才能拿奖励？",
    answer:
      "按当前活动理解（**以 Kalshi 官方为准**）：\n1. 用 **邀请链接** 注册并下载 App。\n2. **护照 KYC** 通过。\n3. **预测市场**累计成交约 **$25**。\n4. **加密货币相关市场**累计成交约 **$50**。\n\n本站 **薅羊毛 → Kalshi（置顶）** 有逐步说明与 refer 链接；另有本站 **预测方向保底返现 $7.5 / 加密最高 $12.5** 文案，完成官方条件后按站内规则联系管理员确认。\n\n**风险：**预测/加密有亏损可能，只用可承受损失的资金。",
    sortOrder: 4,
    pinned: 1,
  },
];

const demoBySessionId = new Map<string, DemoConversation>();

function refreshDemoIndex(list: DemoConversation[]) {
  demoBySessionId.clear();
  list.forEach((item) => {
    demoBySessionId.set(`${DEMO_SESSION_PREFIX}${item.id}`, item);
  });
}

refreshDemoIndex(STATIC_DEMO_CONVERSATIONS);

export function isDemoSessionId(sessionId: string | null | undefined): boolean {
  return Boolean(sessionId?.startsWith(DEMO_SESSION_PREFIX));
}

export function demoSessionId(rawId: string): string {
  return `${DEMO_SESSION_PREFIX}${rawId}`;
}

export function getDemoConversationBySessionId(sessionId: string): DemoConversation | null {
  return demoBySessionId.get(sessionId) ?? null;
}

function sortDemos(list: DemoConversation[]): DemoConversation[] {
  return [...list].sort((a, b) => {
    const pinA = a.pinned ? 1 : 0;
    const pinB = b.pinned ? 1 : 0;
    if (pinA !== pinB) return pinB - pinA;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
}

export async function resolveDemoConversations(): Promise<DemoConversation[]> {
  try {
    const remote = await listDemoConversations();
    if (remote?.length) {
      const sorted = sortDemos(remote);
      refreshDemoIndex(sorted);
      return sorted;
    }
  } catch {
    // API 不可用（旧后端等）时用静态示例
  }
  refreshDemoIndex(STATIC_DEMO_CONVERSATIONS);
  return STATIC_DEMO_CONVERSATIONS;
}

export function demoConversationToSession(item: DemoConversation, index: number): Session {
  const daysAgo = Math.min(index, 6);
  const lastTime = new Date(Date.now() - daysAgo * 86400000).toISOString();
  return {
    id: demoSessionId(item.id),
    title: item.title || item.question.slice(0, 28),
    lastTime,
  };
}

export function demoConversationToMessages(item: DemoConversation): Message[] {
  const now = new Date().toISOString();
  return [
    {
      id: `demo-user-${item.id}`,
      role: "user",
      content: item.question,
      status: "done",
      createdAt: now,
    },
    {
      id: `demo-assistant-${item.id}`,
      role: "assistant",
      content: item.answer || "",
      status: "done",
      createdAt: now,
      feedback: null,
    },
  ];
}

export async function loadGuestDemoSessions(): Promise<Session[]> {
  const demos = await resolveDemoConversations();
  return demos.map((item, index) => demoConversationToSession(item, index));
}
