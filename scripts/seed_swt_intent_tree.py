#!/usr/bin/env python3
"""
生成并执行 SWT 意图树种子 SQL。

用法（推荐走 shell 包装）:
  ./scripts/seed-swt-intent-tree.sh
  ./scripts/seed-swt-intent-tree.sh --kb-id <主KB> --deals-kb-id <羊毛KB>
  ./scripts/seed-swt-intent-tree.sh --dry-run > /tmp/intents.sql

也可:
  python3 scripts/seed_swt_intent_tree.py --kb-id XXX --print-sql
"""

from __future__ import annotations

import argparse
import json
import sys
from typing import Any


def node(
    code: str,
    name: str,
    level: int,
    *,
    parent: str | None = None,
    kind: int = 0,
    description: str = "",
    examples: list[str] | None = None,
    prompt_snippet: str = "",
    prompt_template: str = "",
    top_k: int | None = None,
    sort_order: int = 0,
    enabled: int = 1,
    kb: str = "main",  # main | deals | none
) -> dict[str, Any]:
    return {
        "intent_code": code,
        "name": name,
        "level": level,
        "parent_code": parent,
        "kind": kind,
        "description": description,
        "examples": examples or [],
        "prompt_snippet": prompt_snippet,
        "prompt_template": prompt_template,
        "top_k": top_k,
        "sort_order": sort_order,
        "enabled": enabled,
        "kb": kb,
    }


def build_tree() -> list[dict[str, Any]]:
    nodes: list[dict[str, Any]] = []

    # ── DOMAIN: swt ──
    nodes.append(
        node(
            "swt",
            "SWT 全流程",
            0,
            description="Summer Work Travel 从了解到回国的全链路问答",
            examples=["SWT是什么", "我适合参加SWT吗", "第一次去美国打工要注意什么"],
            sort_order=10,
        )
    )

    # intro
    nodes.append(
        node(
            "swt-intro",
            "认识项目",
            1,
            parent="swt",
            description="项目介绍、资格、费用、常见误区",
            examples=["SWT项目介绍", "参加条件有哪些", "中介费一般多少", "有哪些坑"],
            sort_order=10,
        )
    )
    nodes += [
        node(
            "swt-intro-overview",
            "项目概述",
            2,
            parent="swt-intro",
            description="BridgeUSA / SWT 定义、周期、与其他签证区别",
            examples=["SWT是什么项目", "J-1 Summer Work Travel是什么", "可以做几个月", "和实习签证有什么区别"],
            prompt_snippet="先用 3～5 句说明项目定义与周期，再引导资格与费用；可引用 /docs",
            top_k=6,
            sort_order=10,
        ),
        node(
            "swt-intro-eligibility",
            "资格条件",
            2,
            parent="swt-intro",
            description="学历、年级、语言、年龄等资格",
            examples=["大几才能申请", "英语要求", "专业有限制吗", "往届生还能去吗", "年龄要求"],
            prompt_snippet="对照资格清单回答；不确定处提醒以 sponsor/中介与官网为准。对应 /docs/intro/eligibility",
            top_k=6,
            sort_order=20,
        ),
        node(
            "swt-intro-costs",
            "项目费用与预算",
            2,
            parent="swt-intro",
            description="中介费、行前资金、落地开销",
            examples=["总共要准备多少钱", "中介费包含什么", "行前押金", "落地还要花多少"],
            prompt_snippet="分项估算费用并提醒因中介/州而异。对应 /docs/intro/project-costs",
            top_k=8,
            sort_order=30,
        ),
        node(
            "swt-intro-myths",
            "误区与避坑",
            2,
            parent="swt-intro",
            description="包吃住、回本、换岗等误区",
            examples=["包吃住就是白嫖吗", "一定能赚回本吗", "换岗很简单吗", "被中介坑了怎么办"],
            prompt_snippet="纠正常见误区并给可执行避坑建议。对应 /docs/intro/myths",
            top_k=8,
            sort_order=40,
        ),
        node(
            "swt-intro-faq",
            "入门 FAQ",
            2,
            parent="swt-intro",
            description="认识项目常见问题",
            examples=["常见问题汇总", "第一次参加最关心什么"],
            prompt_snippet="优先回答高频 FAQ。对应 /docs/intro/faq",
            top_k=6,
            sort_order=50,
        ),
    ]

    # apply
    nodes.append(
        node(
            "swt-apply",
            "报名选岗",
            1,
            parent="swt",
            description="中介、时间线、岗位类型、选岗、面试、Offer对比",
            examples=["怎么选中介", "选岗流程", "Skype面试说什么", "两个offer怎么比"],
            sort_order=20,
        )
    )
    nodes += [
        node(
            "swt-apply-agency",
            "中介与 Sponsor",
            2,
            parent="swt-apply",
            description="中介选择、sponsor 职责、更换服务商",
            examples=["怎么选中介", "sponsor是干什么的", "中介和服务商区别", "被换sponsor怎么办"],
            prompt_snippet="区分中介与 sponsor；材料与合规以官方为准。对应 /docs/apply/agency",
            top_k=8,
            sort_order=10,
        ),
        node(
            "swt-apply-timeline",
            "时间线与节点",
            2,
            parent="swt-apply",
            description="报名到出行关键时间节点",
            examples=["现在开始还来得及吗", "签证要提前多久", "整个流程时间表"],
            prompt_snippet="给出阶段时间线，强调因使馆/中介而异。对应 /docs/apply/timeline",
            top_k=6,
            sort_order=20,
        ),
        node(
            "swt-apply-roles",
            "岗位类型与州选择",
            2,
            parent="swt-apply",
            description="酒店/餐厅/水上乐园等岗位与热门州",
            examples=["酒店和餐厅哪个好", "阿拉斯加值得去吗", "哪些州中国人多", "水上乐园怎么样"],
            prompt_snippet="可结合热门目的地经验，并引导 /jobs 与 /compare。对应 /docs/apply/roles",
            top_k=8,
            sort_order=30,
        ),
        node(
            "swt-apply-selection",
            "选岗策略",
            2,
            parent="swt-apply",
            description="时薪、住宿、工时权衡与「夯/拉」粗评",
            examples=["怎么选岗不踩坑", "时薪低但包住值不值", "夯还是拉怎么判断"],
            prompt_snippet="可用夯/NPC/拉粗评，但必须引导用选岗计算器算净收入。对应 /docs/apply/selection",
            top_k=8,
            sort_order=40,
        ),
        node(
            "swt-apply-interview",
            "面试话术",
            2,
            parent="swt-apply",
            description="Skype/雇主面试准备",
            examples=["Skype面试怎么准备", "雇主常问什么", "英语不好怎么答", "自我介绍模板"],
            prompt_snippet="给可复述话术与注意事项。对应 /docs/apply/interview",
            top_k=8,
            sort_order=50,
        ),
        node(
            "swt-apply-compare",
            "Offer 对比与净收入",
            2,
            parent="swt-apply",
            description="时薪、住宿、小费、州税与站内计算器",
            examples=["两个offer怎么比净收入", "包住宿值不值", "周工时30和40差多少", "帮我算税后收入"],
            prompt_snippet="引导打开站内选岗计算器 /compare；不要只给空泛建议。",
            top_k=8,
            sort_order=60,
        ),
    ]

    # visa
    nodes.append(
        node(
            "swt-visa",
            "签证材料",
            1,
            parent="swt",
            description="护照、材料、面签、FAQ",
            examples=["签证材料清单", "面签怎么答", "护照丢了怎么办"],
            sort_order=30,
        )
    )
    nodes += [
        node(
            "swt-visa-passport",
            "护照",
            2,
            parent="swt-visa",
            description="护照有效期与页数要求",
            examples=["护照有效期要多久", "护照不够页怎么办"],
            prompt_snippet="对应 /docs/visa/passport",
            top_k=6,
            sort_order=10,
        ),
        node(
            "swt-visa-materials",
            "签证材料包",
            2,
            parent="swt-visa",
            description="DS-2019、SEVIS、面签材料",
            examples=["DS-2019是什么", "SEVIS费", "面签要带什么"],
            prompt_snippet="对应 /docs/visa/visa-materials",
            top_k=8,
            sort_order=20,
        ),
        node(
            "swt-visa-interview",
            "签证面签",
            2,
            parent="swt-visa",
            description="签证面签问题与策略",
            examples=["签证官会问什么", "怎么证明会回国", "被拒签怎么办"],
            prompt_snippet="对应 /docs/visa/visa-interview",
            top_k=8,
            sort_order=30,
        ),
        node(
            "swt-visa-faq",
            "签证 FAQ",
            2,
            parent="swt-visa",
            description="签证常见问题",
            examples=["签证常见问题", "签证多久出结果"],
            prompt_snippet="对应 /docs/visa/visa-faq",
            top_k=6,
            sort_order=40,
        ),
        node(
            "swt-visa-passport-lost",
            "护照丢失",
            2,
            parent="swt-visa",
            description="在美护照丢失处理",
            examples=["护照丢了怎么办", "在美国补护照"],
            prompt_snippet="对应 /docs/visa/passport-lost",
            top_k=6,
            sort_order=50,
        ),
    ]

    # departure
    nodes.append(
        node(
            "swt-departure",
            "行前准备",
            1,
            parent="swt",
            description="机票、行李、通讯、资金、邮件与工具",
            examples=["行前清单", "带什么行李", "美国电话卡", "机票怎么买"],
            sort_order=40,
        )
    )
    nodes += [
        node(
            "swt-departure-checklist",
            "行前清单",
            2,
            parent="swt-departure",
            description="行前可勾选清单与落地 72 小时",
            examples=["还有4周出发清单", "落地72小时要做什么", "行前要准备什么"],
            prompt_snippet="给可勾选清单：证件、保险、行李、资金、通讯、落地事项。",
            top_k=8,
            sort_order=10,
        ),
        node(
            "swt-departure-flights",
            "机票",
            2,
            parent="swt-departure",
            description="机票购买与行程安排",
            examples=["机票怎么买", "要买来回程吗", "最早最早落地时间"],
            prompt_snippet="对应 /docs/departure/flights",
            top_k=6,
            sort_order=20,
        ),
        node(
            "swt-departure-packing",
            "行李打包",
            2,
            parent="swt-departure",
            description="行李清单与托运建议",
            examples=["带什么行李", "要不要带转化插头", "行李箱多大合适"],
            prompt_snippet="对应 /docs/departure/packing",
            top_k=6,
            sort_order=30,
        ),
        node(
            "swt-departure-sim",
            "电话卡与通讯",
            2,
            parent="swt-departure",
            description="美国电话卡与上网",
            examples=["美国电话卡怎么选", "落地怎么上网", "eSIM还是实体卡"],
            prompt_snippet="对应 /docs/departure/sim-card",
            top_k=6,
            sort_order=40,
        ),
        node(
            "swt-departure-whatsapp",
            "WhatsApp 与联系方式",
            2,
            parent="swt-departure",
            description="与雇主/室友通讯工具",
            examples=["要装WhatsApp吗", "怎么联系雇主"],
            prompt_snippet="对应 /docs/departure/whatsapp",
            top_k=4,
            sort_order=50,
        ),
        node(
            "swt-departure-money",
            "资金准备",
            2,
            parent="swt-departure",
            description="现金、信用卡、跨境汇款准备",
            examples=["带多少现金", "要不要办双币卡", "落地前怎么换汇"],
            prompt_snippet="对应 /docs/departure/money-prep；可交叉引导薅羊毛开户",
            top_k=6,
            sort_order=60,
        ),
        node(
            "swt-departure-email",
            "邮件模板",
            2,
            parent="swt-departure",
            description="联系雇主/住房邮件模板",
            examples=["怎么给雇主发邮件", "住房确认邮件模板"],
            prompt_snippet="对应 /docs/departure/email-templates",
            top_k=6,
            sort_order=70,
        ),
        node(
            "swt-departure-tools",
            "行前工具与账号",
            2,
            parent="swt-departure",
            description="常用 App 与账号准备",
            examples=["要准备哪些App", "行前账号清单"],
            prompt_snippet="对应 /docs/departure/online-tools",
            top_k=4,
            sort_order=80,
        ),
    ]

    # arrival
    nodes.append(
        node(
            "swt-arrival",
            "落地入境",
            1,
            parent="swt",
            description="入境、I-94、SSN、SEVIS、安顿",
            examples=["入境要注意什么", "怎么拿SSN", "SEVIS怎么check-in"],
            sort_order=50,
        )
    )
    nodes += [
        node(
            "swt-arrival-guide",
            "入境与接机",
            2,
            parent="swt-arrival",
            description="海关入境与抵达流程",
            examples=["入境要注意什么", "海关会问什么", "接机怎么安排"],
            prompt_snippet="对应 /docs/arrival/arrival-guide",
            top_k=6,
            sort_order=10,
        ),
        node(
            "swt-arrival-i94-ssn",
            "I-94 与 SSN",
            2,
            parent="swt-arrival",
            description="I-94 查询与 SSN 申请",
            examples=["I-94在哪查", "SSN怎么预约", "没有SSN能开工吗"],
            prompt_snippet="对应 /docs/arrival/i94-ssn",
            top_k=8,
            sort_order=20,
        ),
        node(
            "swt-arrival-sevis",
            "SEVIS Check-in",
            2,
            parent="swt-arrival",
            description="SEVIS 报到与信息更新",
            examples=["SEVIS怎么check-in", "多久必须报到"],
            prompt_snippet="对应 /docs/arrival/sevis-checkin",
            top_k=6,
            sort_order=30,
        ),
        node(
            "swt-arrival-settling",
            "落地安顿",
            2,
            parent="swt-arrival",
            description="抵达后住房、交通、开户等安顿",
            examples=["落地第一周做什么", "怎么安顿下来"],
            prompt_snippet="对应 /docs/arrival/settling-in",
            top_k=6,
            sort_order=40,
        ),
    ]

    # living
    nodes.append(
        node(
            "swt-living",
            "在美生活",
            1,
            parent="swt",
            description="住房、餐饮、开销、安全、医疗、工作规则",
            examples=["租房要注意什么", "生活费多少", "能打两份工吗", "生病了怎么办"],
            sort_order=60,
        )
    )
    nodes += [
        node(
            "swt-living-housing",
            "住房",
            2,
            parent="swt-living",
            description="雇主宿舍与外部租房",
            examples=["租房要注意什么", "雇主包住坑有哪些", "押金能退吗"],
            prompt_snippet="对应 /docs/living/housing",
            top_k=8,
            sort_order=10,
        ),
        node(
            "swt-living-food",
            "餐饮与采购",
            2,
            parent="swt-living",
            description="吃饭与超市采购",
            examples=["美国怎么自己做饭", "超市哪个便宜"],
            prompt_snippet="对应 /docs/living/food",
            top_k=6,
            sort_order=20,
        ),
        node(
            "swt-living-cost",
            "生活成本",
            2,
            parent="swt-living",
            description="月开销与省钱",
            examples=["一个月生活费多少", "怎么省钱"],
            prompt_snippet="对应 /docs/living/living-cost",
            top_k=6,
            sort_order=30,
        ),
        node(
            "swt-living-work-rules",
            "工作规则与合规",
            2,
            parent="swt-living",
            description="工时、减班、证据留存",
            examples=["最低工时", "被减班怎么办", "留什么证据"],
            prompt_snippet="对应 /docs/living/work-rules；减班场景强调联系 sponsor 留证",
            top_k=8,
            sort_order=40,
        ),
        node(
            "swt-living-second-job",
            "第二份工作与换岗",
            2,
            parent="swt-living",
            description="换雇主、第二份工合规",
            examples=["能换雇主吗", "SEVIS改工作信息", "第二份工合规吗"],
            prompt_snippet="对应 /docs/living/second-job",
            top_k=8,
            sort_order=50,
        ),
        node(
            "swt-living-safety",
            "安全",
            2,
            parent="swt-living",
            description="人身与财产安全",
            examples=["美国安全吗", "晚上出门注意什么"],
            prompt_snippet="对应 /docs/living/safety",
            top_k=4,
            sort_order=60,
        ),
        node(
            "swt-living-medical",
            "医疗与保险",
            2,
            parent="swt-living",
            description="看病与保险使用",
            examples=["生病了怎么办", "保险怎么用", "急诊贵不贵"],
            prompt_snippet="对应 /docs/living/medical",
            top_k=6,
            sort_order=70,
        ),
        node(
            "swt-living-reselling",
            "闲置转卖与省钱",
            2,
            parent="swt-living",
            description="二手交易与省钱技巧",
            examples=["东西怎么二手卖掉", "回国前怎么处理大件"],
            prompt_snippet="对应 /docs/living/reselling",
            top_k=4,
            sort_order=80,
        ),
    ]

    # transport
    nodes.append(
        node(
            "swt-transport",
            "出行交通",
            1,
            parent="swt",
            description="打车、公交、火车、大巴、租车、跨州旅行",
            examples=["美国怎么打车", "跨州旅游坐什么", "能不能租车"],
            sort_order=70,
        )
    )
    transport_leaves = [
        ("swt-transport-uber", "Uber/Lyft", "uber", ["怎么打Uber", "Lyft和Uber哪个好"], 10),
        ("swt-transport-bus", "公交", "bus", ["美国公交怎么坐", "公交卡怎么买"], 20),
        ("swt-transport-metro", "地铁", "metro", ["纽约怎么坐地铁", "地铁App推荐"], 30),
        ("swt-transport-train", "火车", "train", ["Amtrak怎么买票", "坐火车跨州"], 40),
        ("swt-transport-coach", "长途大巴", "coach", ["Greyhound怎么样", "大巴跨州便宜吗"], 50),
        ("swt-transport-car", "租车", "car-rental", ["SWT能租车吗", "租车要国际驾照吗"], 60),
        ("swt-transport-bike", "骑行", "bicycle", ["买二手自行车吗", "骑行安全"], 70),
        ("swt-transport-travel", "周末与跨州旅行", "domestic-travel", ["周末去哪玩", "跨州旅行注意什么"], 80),
    ]
    for code, name, slug, examples, so in transport_leaves:
        nodes.append(
            node(
                code,
                name,
                2,
                parent="swt-transport",
                description=f"交通出行：{name}",
                examples=examples,
                prompt_snippet=f"对应 /docs/transport/{slug}",
                top_k=6,
                sort_order=so,
            )
        )

    # return
    nodes.append(
        node(
            "swt-return",
            "回国与收尾",
            1,
            parent="swt",
            description="退税、预扣、Grace period、副业、银行奖金",
            examples=["怎么退税", "W-2是什么", "项目结束后能玩几天", "开户奖励"],
            sort_order=80,
        )
    )
    nodes += [
        node(
            "swt-return-taxes",
            "退税报税总览",
            2,
            parent="swt-return",
            description="W-2、退税时间线与注意事项",
            examples=["SWT结束怎么退税", "有W-2怎么报税", "退税时间线"],
            prompt_snippet="强调非专业税务建议，复杂找 CPA。对应 /docs/return/taxes",
            top_k=8,
            sort_order=10,
        ),
        node(
            "swt-return-withholding",
            "工资预扣",
            2,
            parent="swt-return",
            description="payroll withholding 说明",
            examples=["工资为什么扣这么多", "withholding是什么"],
            prompt_snippet="对应 /docs/return/payroll-withholding",
            top_k=6,
            sort_order=20,
        ),
        node(
            "swt-return-tax-states",
            "分州报税",
            2,
            parent="swt-return",
            description="各州报税差异（如 NJ）",
            examples=["新泽西要州税吗", "在哪个州工作怎么报税"],
            prompt_snippet="对应 /docs/return/tax-states/*",
            top_k=6,
            sort_order=30,
        ),
        node(
            "swt-return-grace",
            "Grace period 旅游",
            2,
            parent="swt-return",
            description="项目结束后合规停留与旅行",
            examples=["项目结束后还能待多久", "grace period注意事项"],
            prompt_snippet="必须提醒与 sponsor 确认，勿给绝对日期承诺。对应 /docs/return/grace-travel",
            top_k=6,
            sort_order=40,
        ),
        node(
            "swt-return-side",
            "副业与额外收入",
            2,
            parent="swt-return",
            description="合规范围内的额外收入讨论",
            examples=["能不能做副业", "额外收入要注意什么"],
            prompt_snippet="对应 /docs/return/side-hustles；强调签证合规",
            top_k=4,
            sort_order=50,
        ),
        node(
            "swt-return-bank-bonus",
            "银行开户奖金",
            2,
            parent="swt-return",
            description="低存入门槛银行奖金（可交叉 deals）",
            examples=["银行开户奖励", "低存款奖金有哪些"],
            prompt_snippet="对应 /docs/return/low-deposit-bank-bonuses；可引导 /deals",
            top_k=6,
            sort_order=60,
            kb="deals",
        ),
    ]

    # ── DOMAIN: deals ──
    nodes.append(
        node(
            "deals",
            "薅羊毛与 Refer",
            0,
            description="开户奖励、汇款 refer、平台 refer、避坑与领取步骤",
            examples=["Chime怎么领", "Remitly推荐奖励", "Kalshi要交易多少", "银行refer避坑"],
            sort_order=20,
            kb="deals",
        )
    )
    nodes += [
        node(
            "deals-bank",
            "银行开户 Refer",
            1,
            parent="deals",
            description="美国银行开户与 Direct Deposit 奖励",
            examples=["Chime条件", "Direct Deposit怎么算", "学生办美国银行"],
            sort_order=10,
            kb="deals",
        ),
        node(
            "deals-remit",
            "汇款 Refer",
            1,
            parent="deals",
            description="Remitly / Wise / LemFi 等汇款邀请",
            examples=["Remitly邀请码", "Wise推荐奖励", "汇款哪家划算"],
            sort_order=20,
            kb="deals",
        ),
        node(
            "deals-platform",
            "平台 Refer",
            1,
            parent="deals",
            description="Kalshi 等平台邀请奖励",
            examples=["Kalshi refer", "要完成多少交易"],
            sort_order=30,
            kb="deals",
        ),
        node(
            "deals-howto",
            "领取步骤与避坑",
            1,
            parent="deals",
            description="奖励领取流程与常见坑",
            examples=["refer奖励不到账", "常见坑", "官方条款变化"],
            sort_order=40,
            kb="deals",
        ),
        node(
            "deals-bank-chime",
            "Chime",
            2,
            parent="deals-bank",
            description="Chime 开户与 refer",
            examples=["Chime refer怎么领", "Chime DD要求"],
            prompt_snippet="优先引用站内 /deals 对应项目；条款以官网为准",
            top_k=6,
            sort_order=10,
            kb="deals",
        ),
        node(
            "deals-remit-remitly",
            "Remitly",
            2,
            parent="deals-remit",
            description="Remitly 汇款邀请",
            examples=["Remitly邀请奖励", "Remitly怎么用"],
            prompt_snippet="引导 /deals 项目页；奖励以官网为准",
            top_k=6,
            sort_order=10,
            kb="deals",
        ),
        node(
            "deals-remit-wise",
            "Wise",
            2,
            parent="deals-remit",
            description="Wise 推荐奖励",
            examples=["Wise推荐码", "Wise转账费用"],
            prompt_snippet="引导 /deals 项目页；奖励以官网为准",
            top_k=6,
            sort_order=20,
            kb="deals",
        ),
        node(
            "deals-remit-lemfi",
            "LemFi",
            2,
            parent="deals-remit",
            description="LemFi 汇款 refer",
            examples=["LemFi refer", "LemFi怎么领奖励"],
            prompt_snippet="引导 /deals 项目页；奖励以官网为准",
            top_k=6,
            sort_order=30,
            kb="deals",
        ),
        node(
            "deals-platform-kalshi",
            "Kalshi",
            2,
            parent="deals-platform",
            description="Kalshi 平台邀请与交易要求",
            examples=["Kalshi要交易多少", "Kalshi refer条件"],
            prompt_snippet="引导 /deals 项目页；说明风险与合规",
            top_k=6,
            sort_order=10,
            kb="deals",
        ),
        node(
            "deals-howto-claim",
            "领取与到账问题",
            2,
            parent="deals-howto",
            description="奖励不到账、条件未满足等",
            examples=["奖励不到账怎么办", "DD没算数怎么办"],
            prompt_snippet="给出排查步骤并强调以品牌官方客服与条款为准；引导 /deals",
            top_k=6,
            sort_order=10,
            kb="deals",
        ),
    ]

    # ── DOMAIN: jobs ──
    nodes.append(
        node(
            "jobs",
            "岗位情报",
            0,
            description="历史岗位评价、州/雇主经验、用户投稿",
            examples=["某州酒店怎么样", "这个雇主靠谱吗", "阿拉斯加渔厂评价"],
            sort_order=30,
        )
    )
    nodes += [
        node(
            "jobs-browse",
            "查评价",
            1,
            parent="jobs",
            description="按州/雇主浏览岗位情报",
            examples=["查岗位评价", "某州工资水平"],
            sort_order=10,
        ),
        node(
            "jobs-browse-state",
            "按州查岗位",
            2,
            parent="jobs-browse",
            description="按美国州查询历史情报",
            examples=["纽约岗位怎么样", "威斯康星酒店评价", "佛罗里达水上乐园"],
            prompt_snippet="引导 /jobs；说明情报有时效与个体差异",
            top_k=8,
            sort_order=10,
        ),
        node(
            "jobs-browse-employer",
            "按雇主/岗位类型查",
            2,
            parent="jobs-browse",
            description="按雇主或岗位类型查询",
            examples=["这家雇主靠谱吗", "酒店客房岗位评价"],
            prompt_snippet="引导 /jobs；避免绝对化结论",
            top_k=8,
            sort_order=20,
        ),
        node(
            "jobs-submit",
            "投稿说明",
            1,
            parent="jobs",
            description="用户如何提交岗位情报",
            examples=["我想上传评价", "怎么投稿岗位情报"],
            sort_order=20,
        ),
        node(
            "jobs-submit-how",
            "如何提交情报",
            2,
            parent="jobs-submit",
            description="投稿入口与审核说明",
            examples=["怎么提交岗位情报", "上传工资条/评价流程"],
            prompt_snippet="引导用户前往 /jobs 提交；说明需审核",
            top_k=4,
            sort_order=10,
        ),
    ]

    # ── DOMAIN: site (SYSTEM) ──
    nodes.append(
        node(
            "site",
            "站内功能",
            0,
            kind=1,
            description="引导使用计算器、文档、薅羊毛、岗位页、账号",
            examples=["计算器在哪", "文档入口", "怎么注册"],
            sort_order=40,
            kb="none",
        )
    )
    site_children = [
        ("site-compare", "选岗计算器", ["计算器在哪", "怎么比offer"], "引导打开 /compare", 10),
        ("site-docs", "文档中心", ["文档在哪看", "SWT攻略入口"], "引导打开 /docs", 20),
        ("site-deals-page", "薅羊毛页面", ["羊毛入口", "refer活动在哪"], "引导打开 /deals", 30),
        ("site-jobs-page", "岗位情报页", ["岗位评价入口"], "引导打开 /jobs", 40),
        ("site-account", "登录注册与钱包", ["怎么注册", "AI次数怎么买"], "引导登录/注册与个人主页钱包", 50),
    ]
    for code, name, examples, snippet, so in site_children:
        nodes.append(
            node(
                code,
                name,
                1,
                parent="site",
                kind=1,
                description=name,
                examples=examples,
                prompt_snippet=snippet,
                prompt_template=(
                    "你是 SWT Helper 站内引导助手。用简短中文告诉用户对应入口链接与下一步操作，"
                    "不要编造站外流程。"
                ),
                sort_order=so,
                kb="none",
            )
        )

    # ── DOMAIN: sys (SYSTEM) ──
    nodes.append(
        node(
            "sys",
            "系统交互",
            0,
            kind=1,
            description="问候、关于助手、闲聊、澄清、拒答边界",
            examples=["你好", "你是谁", "谢谢"],
            sort_order=90,
            kb="none",
        )
    )
    nodes += [
        node(
            "sys-welcome",
            "欢迎问候",
            1,
            parent="sys",
            kind=1,
            description="打招呼与开场",
            examples=["你好", "hi", "hello", "在吗", "哈喽"],
            prompt_template="简短欢迎用户，并提示可问 SWT 选岗、签证、落地、薅羊毛等问题。",
            sort_order=10,
            kb="none",
        ),
        node(
            "sys-about",
            "关于助手",
            1,
            parent="sys",
            kind=1,
            description="能力边界说明",
            examples=["你是谁", "能做什么", "你是中介吗"],
            prompt_template=(
                "说明你是 SWT Helper AI 助手，可协助 Summer Work Travel 攻略、选岗对比、薅羊毛信息；"
                "你不是签证中介/律师/税务师，重要合规以 sponsor 与官方为准。"
            ),
            sort_order=20,
            kb="none",
        ),
        node(
            "sys-chitchat",
            "闲聊兜底",
            1,
            parent="sys",
            kind=1,
            description="寒暄与结束语",
            examples=["哈哈", "谢谢", "再见", "拜拜", "好的"],
            prompt_template="短回复并自然拉回 SWT 相关问题。",
            sort_order=30,
            kb="none",
        ),
        node(
            "sys-clarify",
            "澄清提问",
            1,
            parent="sys",
            kind=1,
            description="信息不足时追问关键槽位",
            examples=["那个岗位怎么样", "怎么办"],
            prompt_template="追问州/时薪/住宿/时间节点等关键信息后再给建议。",
            sort_order=40,
            kb="none",
        ),
        node(
            "sys-unsafe",
            "拒答边界",
            1,
            parent="sys",
            kind=1,
            description="违法违规或伪造材料请求",
            examples=["帮我伪造材料", "怎么黑工", "如何欺骗签证官"],
            prompt_template="明确拒绝违法或欺骗请求，并给出合规替代建议（联系 sponsor/正规渠道）。",
            sort_order=50,
            kb="none",
        ),
    ]

    return nodes


def sql_quote(value: str | None) -> str:
    if value is None:
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


def sql_escape_literal(value: str) -> str:
    return value.replace("'", "''")


def stable_id(index: int) -> str:
    # 19 chars, fits VARCHAR(20); prefix 82 = SWT intent seed namespace
    return f"82{index:017d}"


def resolve_kb(
    n: dict[str, Any],
    main_kb: str | None,
    deals_kb: str | None,
    main_col: str | None,
    deals_col: str | None,
) -> tuple[str | None, str | None]:
    kind = n["kb"]
    if n["kind"] == 1 or kind == "none":
        return None, None
    if kind == "deals":
        if deals_kb:
            return deals_kb, deals_col or main_col
        return main_kb, main_col
    return main_kb, main_col


def generate_sql(
    nodes: list[dict[str, Any]],
    *,
    main_kb: str | None,
    deals_kb: str | None,
    main_col: str | None,
    deals_col: str | None,
    disable_demo: bool,
) -> str:
    lines: list[str] = [
        "-- SWT Intent Tree seed (generated by scripts/seed_swt_intent_tree.py)",
        "-- Re-runnable: soft-deletes previous seed-swt-intent rows, then inserts fresh ones.",
        "BEGIN;",
        "",
        "-- 软删除此前由本脚本写入的节点",
        "UPDATE t_intent_node",
        "SET deleted = 1, update_time = CURRENT_TIMESTAMP, update_by = 'seed-swt-intent'",
        "WHERE create_by = 'seed-swt-intent' AND deleted = 0;",
        "",
    ]
    if disable_demo:
        lines += [
            "-- 禁用演示树（集团信息化 / OA / sales）避免抢分类",
            "UPDATE t_intent_node",
            "SET enabled = 0, update_time = CURRENT_TIMESTAMP, update_by = 'seed-swt-intent'",
            "WHERE deleted = 0 AND enabled = 1 AND (",
            "  intent_code LIKE 'group%' OR intent_code LIKE 'biz%' OR intent_code LIKE 'sales%'",
            "  OR intent_code IN ('sys-about-bot')",
            ");",
            "",
        ]

    missing_topic_kb = 0
    for i, n in enumerate(nodes, start=1):
        nid = stable_id(i)
        kb_id, coll = resolve_kb(n, main_kb, deals_kb, main_col, deals_col)
        if n["level"] == 2 and n["kind"] == 0 and not kb_id:
            missing_topic_kb += 1
        examples_json = json.dumps(n["examples"], ensure_ascii=False)
        top_k_sql = "NULL" if n["top_k"] is None else str(int(n["top_k"]))
        parent_sql = "NULL" if not n["parent_code"] else sql_quote(n["parent_code"])
        kb_sql = "NULL" if not kb_id else sql_quote(kb_id)
        coll_sql = "NULL" if not coll else sql_quote(coll)

        lines.append(
            "INSERT INTO t_intent_node ("
            "id, kb_id, intent_code, name, level, parent_code, description, examples, "
            "collection_name, top_k, mcp_tool_id, kind, prompt_snippet, prompt_template, "
            "param_prompt_template, sort_order, enabled, create_by, update_by, "
            "create_time, update_time, deleted"
            ") VALUES ("
            f"{sql_quote(nid)}, {kb_sql}, {sql_quote(n['intent_code'])}, {sql_quote(n['name'])}, "
            f"{n['level']}, {parent_sql}, {sql_quote(n['description'])}, {sql_quote(examples_json)}, "
            f"{coll_sql}, {top_k_sql}, NULL, {n['kind']}, "
            f"{sql_quote(n['prompt_snippet'])}, {sql_quote(n['prompt_template'])}, NULL, "
            f"{n['sort_order']}, {n['enabled']}, 'seed-swt-intent', 'seed-swt-intent', "
            "CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0"
            ");"
        )

    lines += [
        "",
        "COMMIT;",
        "",
        f"-- nodes={len(nodes)} missing_topic_kb={missing_topic_kb}",
    ]
    if missing_topic_kb:
        lines.append(
            "-- WARNING: some TOPIC/KB nodes have NULL kb_id. "
            "Pass --kb-id / --deals-kb-id or ensure t_knowledge_base has rows."
        )
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate SWT intent tree seed SQL")
    parser.add_argument("--kb-id", default="", help="Main knowledge base id")
    parser.add_argument("--deals-kb-id", default="", help="Deals knowledge base id (fallback to main)")
    parser.add_argument("--kb-collection", default="", help="Main KB collection_name")
    parser.add_argument("--deals-kb-collection", default="", help="Deals KB collection_name")
    parser.add_argument("--disable-demo", action="store_true", help="Disable factory demo intents")
    parser.add_argument("--print-sql", action="store_true", help="Print SQL to stdout")
    parser.add_argument("--count", action="store_true", help="Print node count only")
    args = parser.parse_args()

    nodes = build_tree()
    if args.count:
        print(len(nodes))
        return 0

    sql = generate_sql(
        nodes,
        main_kb=args.kb_id or None,
        deals_kb=args.deals_kb_id or None,
        main_col=args.kb_collection or None,
        deals_col=args.deals_kb_collection or None,
        disable_demo=args.disable_demo,
    )
    if args.print_sql or True:
        sys.stdout.write(sql)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
