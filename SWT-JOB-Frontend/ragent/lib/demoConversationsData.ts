import type { DemoConversation } from "@/services/demoConversationService";

/** 与 seed 对齐；API 不可用时兜底。回答用 Markdown 链接指向站内文档，少用加粗星号。 */
export const STATIC_DEMO_CONVERSATIONS: DemoConversation[] = [
  {
    id: "9100000000000000001",
    title: "两个 Offer 怎么选？",
    description: "净收入 · 住宿 · 小费 · 计算器",
    question:
      "我在纠结两个 SWT offer：A 佛罗里达游乐园餐饮 $14/h 包住宿但通勤远；B 加州前台 $17/h 不包住宿。怎么比净收入？",
    answer: "",
    turns: [
      {
        role: "user",
        content:
          "我在纠结两个 SWT offer：A 佛罗里达游乐园餐饮 $14/h 包住宿但通勤远；B 加州前台 $17/h 不包住宿。怎么比净收入？",
      },
      {
        role: "assistant",
        content: `先别只看时薪。建议按下面四步粗算（非法律/税务建议）：

1. 合同 guaranteed hours × 时薪 = 毛收入下限  
2. 减去住宿：A 若 truly 包 housing，按 $0 租；B 要查 city 周租（常 $150–250/周）  
3. 减去通勤：A 若无车，查 shuttle 或拼车成本  
4. 小费：餐饮/前台在流量大的园区，小费可能相当于多 2–4 $/h

A 更像「生活半径小但能存钱」；B 时薪好看但 rent 会把净收入拉回去。

依据文档：  
- [选岗与时间线](/docs/apply/timeline)  
- [工作规则与工时](/docs/living/work-rules)  

下一步：打开 [选岗计算器](/compare)，把 hourly、hours、rent、州税填进去做三档场景（保守/合同/旺季）。`,
      },
      {
        role: "user",
        content: "计算器里 rent 我填每周 $180 合理吗？B 在 Anaheim 附近。",
      },
      {
        role: "assistant",
        content: `Anaheim 一带 shared room 常见大约 $150–220/周，$180 属于中间档，可以先当 baseline，再做一个 +$40 的 stress test。

若 B 合同写 guaranteed 32h，$17/h 毛收入约 $544/周；扣 $180 rent 约剩 $364，还没算税、手机、通勤。

A 若 $14/h、40h guaranteed 约 $560，且 rent≈0，但通勤/shuttle 要算进去。很多 SWT 最终净存取决于 peak 是否加到 50h+ 以及小费。

仍建议对照 [工作规则](/docs/living/work-rules) 确认 OT 是否自动算、是否有 unpaid break。`,
      },
      {
        role: "user",
        content: "最后帮我一句话总结选哪个？",
      },
      {
        role: "assistant",
        content: `若你的目标是「尽量少变量、先把钱存下来」且能接受小镇生活半径，A 往往更稳；若你更在意时薪数字、愿意自己扛租屋和预算管理，B 可以，但务必用计算器证明 peak 工时下仍然净收入更高。

登录后你可以把两个 offer 的 hourly、guaranteed hours、housing 条款贴给我，我可以按同一套模板帮你填一版 compare 表。`,
      },
    ],
    sortOrder: 0,
    pinned: 1,
  },
  {
    id: "9100000000000000002",
    title: "行前 4 周 checklist",
    description: "签证 · 保险 · 行李 · 落地",
    question: "离出发还有 4 周，SWT 行前最该先搞定哪几件事？",
    turns: [
      {
        role: "user",
        content: "离出发还有 4 周，SWT 行前最该先搞定哪几件事？请按优先级。",
      },
      {
        role: "assistant",
        content: `按优先级（与 [Journey 总览](/docs/journey) 一致）：

1. 护照 / 签证 / SEVIS：I-20 或 DS-2019 信息、资金证明、入境窗口是否与 travel date 匹配  
2. 保险：按 sponsor 要求买满项目期，PDF 存手机离线  
3. 资金与支付：少量现金 + 能在美国用的借记/信用卡；算 first-week 预算  
4. 行李与禁带：TSA/航司液体与药品原包装  
5. 落地联系链：雇主、sponsor、室友 WhatsApp，截图 offline

详细清单见 [申请时间线](/docs/apply/timeline)。`,
      },
      {
        role: "user",
        content: "保险一定要 sponsor 指定的那家吗？",
      },
      {
        role: "assistant",
        content: `多数 sponsor 会指定最低 coverage 或合作渠道；不满足可能被要求补买。以你 sponsor 邮件/portal 为准，不要只看中介口头说法。

把保单 PDF、英文客服电话、member ID 存三份：邮箱、手机、纸质包一份在随身行李。相关说明通常在 [Journey · 行前](/docs/journey) 与 sponsor 文档里。`,
      },
    ],
    sortOrder: 1,
    pinned: 0,
  },
  {
    id: "9100000000000000003",
    title: "SWT 回国怎么退税？",
    description: "W-2 · 身份 · 时间线",
    question: "项目结束有 W-2，人还在美国，怎么开始退税？",
    turns: [
      {
        role: "user",
        content: "项目结束了，我手里有 W-2，人还在美国，什么时候、怎么开始退税流程？",
      },
      {
        role: "assistant",
        content: `一般流程（非税务建议，复杂情况请咨询 CPA）：

1. 核对 W-2：Employer EIN、Box 1 工资、联邦/州预扣  
2. 判断税务居民身份：影响用 1040 还是 1040-NR；SWT 学生常见情况较复杂  
3. 材料：W-2、I-94、护照、往年 return、州税（如有）  
4. 截止日前 mail 或 e-file（视身份与软件支持）

概念梳理见 [归国 · 税务相关](/docs/return)（若子页有更新以文档为准）。`,
      },
      {
        role: "user",
        content: "TurboTax 可以直接用吗？",
      },
      {
        role: "assistant",
        content: `简单、单一 W-2、身份明确的情况有人自用软件搞定；但 SWT 常见 mix of 身份状态、州税、多雇主、小费未申报等问题，盲填 TurboTax 容易选错表格。

更稳妥：找熟悉 NRA（非居民）的 CPA，或学校 international office 推荐的 volunteer program。你可以把 W-2 Box 字段（打码）和 visa 类型发我，登录后我帮你列 checklist，但不替代 CPA 意见。`,
      },
    ],
    sortOrder: 2,
    pinned: 0,
  },
  {
    id: "9100000000000000004",
    title: "低门槛银行开户",
    description: "checking 奖励 · SSN",
    question: "存款不多，SWT 期间想开 checking 拿开户奖励，有哪些 DD 门槛较低的？",
    turns: [
      {
        role: "user",
        content: "我没有很多存款，想开 checking 拿 bonus，DD 门槛别太高，线上能办的有吗？",
      },
      {
        role: "assistant",
        content: `思路：优先看 DD 要求 $500–1000 档、可 online funding 的 checking bonus；F-1/SWT 常见「无 SSN 先开、后补 SSN」路径，但以银行 KYC 为准。

注意：bonus 可能要报税；过早关户可能 clawback；频繁开户可能影响 ChexSystems。

详见 [低存款门槛银行开户奖励](/docs/return/low-deposit-bank-bonuses) 与 [薅羊毛](/deals) 页；有/无 SSN 路径不同。`,
      },
      {
        role: "user",
        content: "无 SSN 落地第一周能开吗？",
      },
      {
        role: "assistant",
        content: `部分银行或 fintech 允许用 passport + I-20 先开 limited account，拿到 SSN 后再升级；各分行政策差异大，落地后先问 employer HR 或同事推荐 local credit union。

落地第一周还要 prioritise：电话卡、雇主报到、I-9。开户可以排在 SSN appointment 之后往往更顺。参考 [Journey](/docs/journey) 落地章节。`,
      },
    ],
    sortOrder: 3,
    pinned: 0,
  },
  {
    id: "9100000000000000005",
    title: "Kalshi refer 怎么领？",
    description: "预测 · 加密成交量",
    question: "Kalshi 邀请注册后，预测和加密市场各要交易多少才拿奖励？",
    answer: `以 Kalshi 官方活动为准（会变动）：

1. 邀请链接注册并完成 KYC  
2. 预测市场累计成交约 $25  
3. 加密相关市场累计成交约 $50  

本站 [薅羊毛 · Kalshi](/deals) 有逐步说明；完成官方条件后按站内规则联系管理员。

风险：预测/加密有亏损可能，只用可承受损失的资金。`,
    sortOrder: 4,
    pinned: 1,
  },
  {
    id: "9100000000000000006",
    title: "面试卡壳怎么办？",
    description: "Skype · 餐饮岗 · 英语",
    question: "Skype 面试一紧张就听不懂，有没有短句救命？",
    turns: [
      {
        role: "user",
        content: "Skype 面试一紧张就听不懂，有没有短句救命？",
      },
      {
        role: "assistant",
        content: `完全可以请求重复，这不扣分。常用三句：

- "Could you repeat that, please?"  
- "Sorry, the connection broke up—one more time?"  
- "Let me make sure I understood: you asked about …"

雇主更看重能听懂指令、态度积极，而不是长自我介绍。场景与模板见 [面试指南](/docs/apply/interview)。`,
      },
      {
        role: "user",
        content: "餐饮岗一般会问什么？",
      },
      {
        role: "assistant",
        content: `高频：能否周末/晚上上班、能否做 standing 8 小时、previous experience、为什么选这个 location。部分会问 availability until when（对照你的 program end date）。

准备 2 个 short stories：一次 teamwork、一次 busy shift。STAR 不必背全，Situation + Action 即可。社区经验见评论区 [面试页](/docs/apply/interview) 或侧栏示例对话。`,
      },
    ],
    sortOrder: 5,
    pinned: 0,
  },
  {
    id: "9100000000000000007",
    title: "二工换岗要注意什么？",
    description: "SEVIS · Sponsor 书面",
    question: "一工结束想留同城做二工，SEVIS 上要做什么？",
    turns: [
      {
        role: "user",
        content: "一工结束想留同城做二工，SEVIS 上要做什么？",
      },
      {
        role: "assistant",
        content: `核心：新雇主必须在 SEVIS 上与你 sponsor 备案一致，且通常需要 sponsor 书面批准，不能私下只换打卡。

步骤概览：  
1. 拿到新 offer / confirmation  
2. 联系 sponsor 提交 change request（各 sponsor portal 不同）  
3. 批准前不要在新雇主处 start work  
4. 保留 email/PDF 留痕  

细则见 [工作规则](/docs/living/work-rules) 与 sponsor 手册。`,
      },
      {
        role: "user",
        content: "还没批下来可以先培训吗？",
      },
      {
        role: "assistant",
        content: `不建议。unpaid training 若被算作 employment，可能有合规风险；各 sponsor 定义不同。最稳妥：书面问 sponsor「May I attend unpaid orientation before approval?」并保存回复。

社区里 NY 酒店岗 OT 案例也提到 HR 审批节奏，见 [工作规则页评论](/docs/living/work-rules)。`,
      },
    ],
    sortOrder: 6,
    pinned: 0,
  },
];
