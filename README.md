# SWT Helper

> 一个专为 Summer Work & Travel (SWT) 项目参与者设计的智能工作选择工具

[Next.js](https://nextjs.org/)
[TypeScript](https://www.typescriptlang.org/)
[Material-UI](https://mui.com/)

## 📖 项目简介

SWT Helper 是一个帮助参加美国 Summer Work & Travel 项目的学生选择、比较和管理工作机会的 Web 应用。通过智能的收入计算、多维度对比和完整的项目指南，帮助参与者做出更明智的决策。

### 核心功能

- 🎯 **工作信息管理** - 录入、编辑和保存多个工作机会
- 📊 **智能收入计算** - 自动计算考虑税收、小费、加班费、第二份工作的净收入
- 🔍 **多维度对比** - 支持最多 3 个工作同时对比，包括收入、地理位置、工作稳定性等
- 📱 **响应式设计** - 完美支持桌面和移动设备
- 📚 **完整项目指南** - 包含行前准备、行中经验、行后归国的详细文档

## ✨ 主要特性

### 收入计算引擎

- 自动计算联邦税和州税（基于真实税率数据）
- 支持小费收入估算
- 加班费计算（1.5 倍时薪）
- 第二份工作收入计算
- 住宿成本扣除
- 人民币汇率转换

### 工作对比功能

- 最多同时对比 3 个工作
- 对比维度包括：
  - 总收入（税前/税后）
  - 净收入（扣除住宿）
  - 工作稳定性评分
  - 生活成本指数
  - 安全等级
  - 雇主评分

### 文档系统

- **行前准备**：时间线、中介选择、面试准备、打包清单等
- **行中指南**：岗位选择、第二份工作、生活成本、安全建议等
- **行后归国**：购物退税、旅行建议、税务处理等

### 文档编辑

- 使用 **Sanity Studio** 作为在线文档编辑后台
- `/docs` 页面统一通过自定义渲染层读取内容
- Sanity 是主内容源，`src/pages/docs/**/*.mdx` 仅作为迁移输入与兜底内容
- 文档导航由 `section` 与 `order` 等结构化字段自动生成

## 🚀 快速开始

### 环境要求

- Node.js 18+ 
- npm 或 yarn

### 安装步骤

1. **克隆仓库**

```bash
git clone https://github.com/your-username/swt-job-picker.git
cd swt-job-picker
```

1. **安装依赖**

```bash
npm install
```

1. **启动开发服务器**

```bash
npm run dev
```

1. **访问应用**

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

1. **启动并访问 Sanity Studio**

```bash
npm run sanity
```

打开 [http://127.0.0.1:3333/studio](http://127.0.0.1:3333/studio)

### 构建生产版本

```bash
npm run build
npm start
```

## 📁 项目结构

```
swt-job-picker/
├── src/
│   ├── app/                 # 主应用组件
│   ├── components/          # React 组件
│   │   ├── JobForm.tsx      # 工作信息表单
│   │   ├── CompareDialog.tsx # 工作对比对话框
│   │   └── ...
│   ├── pages/               # Next.js 页面
│   │   ├── index.tsx        # 首页
│   │   ├── docs/            # 文档页面（Sanity 数据驱动）
│   │   └── api/             # API 路由
│   ├── hooks/               # React Hooks
│   ├── utils/               # 工具函数
│   │   ├── jobMetrics.ts    # 收入计算逻辑
│   │   └── stateTax.ts      # 州税计算
│   ├── data/                # 静态数据
│   │   ├── tax.json         # 税率数据
│   │   └── usCities.ts      # 城市数据
│   └── types/               # TypeScript 类型定义
├── sanity/
│   └── schemaTypes/         # Sanity 内容模型
├── scripts/
│   └── import-docs-to-sanity.mjs # 旧文档导入脚本
├── sanity.config.ts
├── package.json
└── README.md
```

## 🛠️ 技术栈

- **框架**: [Next.js](https://nextjs.org/) - React 全栈框架
- **语言**: [TypeScript](https://www.typescriptlang.org/) - 类型安全
- **UI 库**: [Material-UI (MUI)](https://mui.com/) - React 组件库
- **样式**: [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- **文档**: 自定义 `/docs` 渲染层 + Markdown / Portable Text
- **CMS**: [Sanity](https://www.sanity.io/) - 面向协作的托管式内容平台
- **状态管理**: [Redux Toolkit](https://redux-toolkit.js.org/) - 状态管理
- **日期处理**: [Day.js](https://day.js.org/) - 轻量级日期库

## 📝 使用指南

### 添加工作信息

1. 点击"添加工作"按钮
2. 填写工作基本信息（职位、公司、州、时薪等）
3. 设置工作时间和加班情况
4. 配置住宿信息（如有）
5. 添加第二份工作信息（可选）
6. 填写其他评估指标（稳定性、安全等级等）
7. 保存工作信息

### 对比工作

1. 在已保存的工作卡片上勾选"加入对比"
2. 最多可选择 3 个工作
3. 点击"对比"按钮查看详细对比
4. 对比包括收入、成本、评分等多个维度

### 查看收入明细

- 在添加或编辑工作时，实时预览收入计算
- 查看收入明细卡片，了解：
  - 税前总收入
  - 税收扣除（联邦税 + 州税）
  - 住宿成本
  - 净收入（美元和人民币）

## 📚 文档

项目内置完整的 SWT 项目指南，包括：

- **项目介绍** - 什么是 SWT、适合人群、常见误区
- **行前准备** - 时间线、中介选择、面试、打包清单
- **行中指南** - 岗位选择、第二份工作、生活成本、安全建议
- **行后归国** - 购物退税、旅行建议、税务处理

访问 `/docs` 查看完整文档。

### 文档维护说明

- Sanity 是主内容源，编辑者应优先在 `/studio` 中维护文档
- `src/pages/docs/**/*.mdx` 主要作为迁移输入和无 Sanity 环境时的兜底数据
- 文档导航根据 `section` 与 `order` 字段自动生成
- 新增研究资料分层规范见 `docs/swt-content-research-sources.md`

### 文档架构与信息传输流（当前实现）

#### 1) 文档渲染架构（/docs 页面）

- 页面入口：
  - `src/pages/docs/index.tsx`
  - `src/pages/docs/[...slug].tsx`
- 数据聚合层：
  - `src/lib/docs/content.ts`
- 展示层：
  - `src/components/docs/DocPage.tsx`
  - `src/components/docs/DocsLayout.tsx`
  - `src/components/docs/DocsSidebarNav.tsx`

文档数据来源采用“主备双源”：

1. **主源（优先）**：Sanity `docPage`（`src/lib/sanity/`*）
2. **备源（回退）**：`src/pages/docs/**/*.mdx`（legacy）

说明：仓库根目录的 `docs/*.md` 属于项目说明文档，不参与 `/docs` 前台渲染。

#### 2) 信息传输流（读取链路）

以访问 `/docs/xxx` 为例：

1. Next.js `getStaticProps` 调用 `getDocBySlug()` + `getDocsNavigation()`
2. `content.ts` 先尝试从 Sanity Read Client 读取
3. 若 Sanity 无可用文档，再回退到 `legacy.ts` 读取本地 MDX
4. `prepareDocPage()` 处理标题锚点与目录结构
5. `DocPage` 渲染正文与侧边导航（ISR `revalidate: 60`）

#### 3) 信息传输流（写入链路）

内容编辑有两种方式：

- **方式 A（推荐）**：在 `/studio` 编辑 `docPage`，写入 Sanity 数据集；
- **方式 B（兜底）**：修改 `src/pages/docs/**/*.mdx`，仅在 Sanity 数据缺失时展示。

当 A 与 B 同时存在时，前台以 **A（Sanity）优先**。  
如果希望刚发布内容更快生效，可结合 `/api/revalidate` 做按需刷新。

#### 4) 侧边栏“打开内容后台”说明

- 当前实现优先走站内 `/studio`（内嵌 Studio）；
- 也可单独运行 `npm run sanity` 使用 `http://127.0.0.1:3333/studio`；
- 首次打开 Studio 可能编译较慢，属于正常现象。

### SWT 内容研究来源（新增）

为避免“经验贴当规则”，建议将内容源分为两层：

- **L1 官方硬规则（必须优先）**：`j1visa.state.gov`、`travel.state.gov`、`ecfr.gov`、`irs.gov`
- **L2 社区经验（用于补充）**：小红书、论坛、往届分享，仅作为操作建议和风险提醒

写作规则：

1. 资格、签证、合规、税务规则只能引用 L1；
2. 住房、二工、工时落差、避坑策略可以引用 L2，但需要标注“经验项”；
3. 当 L2 与 L1 冲突时，以 L1 为准；
4. 小红书链接存在失效风险，正文不要依赖单帖，优先沉淀“高频主题”。

### 后续可选增强

- 为文档补充 `status`、`reviewer`、`seoTitle`、`seoDescription` 等协作字段
- 配置 Sanity webhook 到 `/api/revalidate`，让文档发布后更快刷新站点缓存

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- 感谢所有为 SWT 项目提供经验和建议的往届参与者
- 感谢所有开源项目的贡献者

## 📮 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 [Issue](https://github.com/your-username/swt-job-picker/issues)
- 发送 Pull Request

---

**注意**: 本项目为非官方工具，所有信息仅供参考。请以官方机构和 Sponsor 的指导为准。