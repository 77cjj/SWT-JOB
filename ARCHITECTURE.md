# SWT Helper 项目架构文档

## 📋 目录

- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [架构设计](#架构设计)
- [核心模块](#核心模块)
- [数据流](#数据流)
- [路由系统](#路由系统)
- [状态管理](#状态管理)
- [样式系统](#样式系统)
- [构建与部署](#构建与部署)

## 🛠️ 技术栈

### 核心框架

- **Next.js** (latest) - React 全栈框架，提供 SSR、路由、API 路由
- **React** (latest) - UI 库
- **TypeScript** (5.9.3) - 类型安全

### UI 库与样式

- **Material-UI (MUI)** (v7) - React 组件库
  - `@mui/material` - 核心组件
  - `@mui/icons-material` - 图标
  - `@mui/x-date-pickers` - 日期选择器
- **Tailwind CSS** (v4) - 实用优先的 CSS 框架
- **Emotion** - CSS-in-JS（MUI 依赖）

### 文档系统

- **Sanity Studio** - 在线文档编辑后台
- **自定义 `/docs` 渲染层** - 负责导航生成、正文展示与缓存刷新

### 内容管理

- **Sanity** - 托管式内容平台

### 状态管理

- **Redux Toolkit** (v2.10.1) - 状态管理（已安装但未使用）
- **React Context API** - 主题管理
- **localStorage** - 本地数据持久化

### 工具库

- **Day.js** (v1.11.19) - 日期处理

## 📁 项目结构

```
swt-job-picker/
├── src/
│   ├── app/                      # 应用核心组件
│   │   └── HomeExperience.tsx    # 主页面体验组件
│   │
│   ├── components/               # React 组件
│   │   ├── JobForm.tsx           # 工作信息表单（核心）
│   │   ├── SavedJobCard.tsx     # 已保存工作卡片
│   │   ├── JobDetailPanel.tsx   # 工作详情面板
│   │   ├── JobEditDialog.tsx    # 编辑对话框
│   │   ├── CompareDialog.tsx    # 工作对比对话框
│   │   └── IncomeBreakdownCard.tsx # 收入明细卡片
│   │
│   ├── pages/                    # Next.js 页面路由
│   │   ├── _app.tsx              # 应用入口（主题、布局控制）
│   │   ├── index.tsx             # 首页 (/)
│   │   ├── swt.tsx               # SWT 页面
│   │   ├── api/                  # API 路由
│   │   │
│   │   └── docs/                 # 文档系统（Sanity 数据驱动）
│   │       ├── index.tsx         # 文档首页
│   │       └── [...slug].tsx     # 文档详情页
│   │
│   ├── hooks/                     # 自定义 Hooks
│   │   ├── useDevice.ts          # 设备检测（移动/桌面）
│   │   └── useSavedJobs.ts       # 工作数据管理（localStorage）
│   │
│   ├── context/                  # React Context
│   │   └── AppThemeContext.tsx   # 主题管理（亮色/暗色）
│   │
│   ├── layout/                   # 布局组件
│   │   ├── desktop/
│   │   │   └── Layout.tsx        # 桌面端布局
│   │   └── mobile/
│   │       └── Layout.tsx        # 移动端布局
│   │
│   ├── utils/                    # 工具函数
│   │   ├── jobMetrics.ts         # 收入计算引擎（核心）
│   │   └── stateTax.ts           # 州税计算
│   │
│   ├── data/                     # 静态数据
│   │   ├── tax.json              # 美国各州税率数据
│   │   ├── usCities.ts           # 美国城市数据
│   │   └── jobs.ts               # 示例工作数据
│   │
│   ├── types/                    # TypeScript 类型定义
│   │   └── job.ts                # 工作数据类型
│   │
│   ├── theme/                    # 主题配置
│   │   └── theme.ts              # MUI 主题配置
│   │
│   ├── index.css                 # 全局样式
│   └── nextra-overrides.css     # Nextra 样式覆盖
│
├── next.config.mjs               # Next.js 配置（集成 Nextra）
├── tailwind.config.ts            # Tailwind 配置
├── tsconfig.json                 # TypeScript 配置
├── theme.config.tsx              # Nextra 主题配置
└── vercel.json                   # Vercel 部署配置
```

## 🏗️ 架构设计

### 整体架构

```
┌────────────────────────────────────────────┐
│            Next.js Application             │
├────────────────────────────────────────────┤
│                                            │
│  ┌──────────────┐    ┌──────────────┐      │
│  │   Pages      │    │   API Routes │      │
│  │  (Routing)   │    │  (Backend)   │      │
│  └──────┬───────┘    └──────┬───────┘      │
│         │                   │              │
│  ┌──────▼───────────────────▼───────┐      │
│  │         Components Layer         │      │
│  │  (JobForm, CompareDialog, etc.)  │      │
│  └──────┬───────────────────┬───────┘      │
│         │                   │              │
│  ┌──────▼───────┐   ┌───────▼───────┐      │
│  │    Hooks     │   │    Utils      │      │
│  │ (State Mgmt) │   │ (Business)    │      │
│  └──────────────┘   └───────────────┘      │
│                                            │
└────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌──────────────┐    ┌──────────────┐
│ localStorage │    │  Static Data │
│ (Persistence)│    │  (tax.json)  │
└──────────────┘    └──────────────┘
```

### 页面类型

项目包含三种不同类型的页面，每种有不同的渲染策略：

1. **主应用页面** (`/`, `/swt`)
  - 使用 MUI 主题
  - 响应式布局（桌面/移动）
  - 支持暗色模式
2. **文档页面** (`/docs/`*)
  - 使用独立内容站样式
  - 数据优先从 Sanity 读取
  - 无 Sanity 内容时回退到仓库内 MDX

## 🔧 核心模块

### 1. 工作管理模块

**位置**: `src/components/JobForm.tsx`, `src/hooks/useSavedJobs.ts`

**功能**:

- 工作信息录入（职位、公司、薪资、住宿等）
- 工作数据持久化（localStorage）
- 工作编辑和删除

**数据流**:

```
User Input → JobForm → useSavedJobs Hook → localStorage → UI Update
```

### 2. 收入计算引擎

**位置**: `src/utils/jobMetrics.ts`, `src/utils/stateTax.ts`

**功能**:

- 计算税前总收入（基本工资 + 小费 + 加班费 + 第二份工作）
- 计算税收（联邦税 + 州税，基于真实税率数据）
- 计算净收入（扣除税收和住宿）
- 汇率转换（美元 → 人民币）

**计算流程**:

```
工作数据 → 收入计算 → 税收计算 → 净收入 → 人民币转换
```

### 3. 工作对比模块

**位置**: `src/components/CompareDialog.tsx`

**功能**:

- 最多同时对比 3 个工作
- 多维度对比（收入、成本、评分等）
- 可视化展示

### 4. 文档系统

**位置**: `src/pages/docs/`, `src/lib/docs/`, `sanity/`

**技术**: Sanity + 自定义 `/docs` 路由 + Markdown / Portable Text

**功能**:

- 为非技术用户提供在线文档后台
- 通过 `section`、`order` 等结构化字段生成导航
- 支持 Sanity 正文渲染，并保留本地 MDX 兜底能力
- 通过 `/api/revalidate` 触发按需刷新

## 📊 数据流

### 工作数据流

```
┌─────────────┐
│  JobForm    │ 用户输入工作信息
└──────┬──────┘
       │
       ▼
┌─────────────┐
│useSavedJobs │ 管理状态
└──────┬──────┘
       │
       ├──► localStorage (持久化)
       │
       └──► UI Components (显示)
```

### 收入计算流

```
┌─────────────┐
│  JobRecord  │ 工作数据
└──────┬──────┘
       │
       ▼
┌─────────────┐
│computeIncome│ 计算总收入
└──────┬──────┘
       │
       ├──► computeWeeklyStateTax (州税)
       │
       └──► IncomeSummary (结果)
```

## 🗺️ 路由系统

### Next.js 文件路由

```
src/pages/
├── index.tsx          → /
├── swt.tsx            → /swt
└── docs/
    ├── index.mdx      → /docs
    ├── intro/
    │   └── guide.mdx  → /docs/intro/guide
    └── ...
```

## 🔄 状态管理

### 1. 主题状态

**位置**: `src/context/AppThemeContext.tsx`

**管理方式**: React Context API

**持久化**: localStorage (`swt-theme-mode`)

**功能**:

- 亮色/暗色模式切换
- 跟随系统主题（首次访问）
- 跨页面状态同步

### 2. 工作数据状态

**位置**: `src/hooks/useSavedJobs.ts`

**管理方式**: React useState + localStorage

**持久化**: localStorage (`swt-saved-jobs`)

**功能**:

- 工作列表管理
- 添加/更新/删除工作
- 自动同步到 localStorage

**注意**: 使用 hydration 策略避免 SSR/CSR 不一致

### 3. 设备检测

**位置**: `src/hooks/useDevice.ts`

**管理方式**: React useState + window.matchMedia

**功能**: 检测移动/桌面设备，用于响应式布局

## 🎨 样式系统

### 三层样式架构

1. **Tailwind CSS** - 实用类，用于布局和基础样式
2. **Material-UI** - 组件库，用于表单、对话框等复杂组件
3. **自定义 CSS** - 全局样式和覆盖

### 主题隔离

通过 `_app.tsx` 中的条件渲染，实现不同页面的主题隔离：

```typescript
// 文档页面：不应用 MUI 主题
if (isDocs) {
  return <Component {...pageProps} />; // 无主题
}

// 其他页面：MUI 主题 + 暗色模式支持
return (
  <AppThemeProvider>
    <SWTApp />
  </AppThemeProvider>
);
```

### 样式文件

- `src/index.css` - 全局样式
- `src/nextra-overrides.css` - Nextra 样式覆盖
- `src/theme/theme.ts` - MUI 主题配置

## 🚀 构建与部署

### 开发环境

```bash
npm run dev          # 启动开发服务器
```

本地开发时，`npm run dev` 仅启动 Next.js 站点；内容后台通过 `npm run sanity` 单独启动，或直接在 `/studio` 嵌入访问。

### 生产构建

```bash
npm run build        # 构建生产版本
npm start            # 启动生产服务器
```

### 部署

**平台**: Vercel

**配置**: `vercel.json`

**特性**:

- 自动部署（GitHub 推送触发）
- 环境变量管理
- 预览部署（每个 PR）

## 📈 性能优化

### 代码分割

- Next.js 自动代码分割
- 动态导入（`Script` 组件的 `lazyOnload`）

### 缓存策略

- 文档页面：`Cache-Control: no-cache`（确保内容更新）
- 静态资源：Next.js 自动优化

### 数据持久化

- localStorage 用于客户端数据
- 避免不必要的 API 调用

## 🧪 开发规范

### TypeScript

- 严格模式启用
- 类型定义在 `src/types/`
- 避免 `any` 类型

### 代码组织

- 组件按功能分类
- Hooks 提取可复用逻辑
- Utils 包含纯函数

### 命名规范

- 组件：PascalCase (`JobForm.tsx`)
- Hooks：camelCase with `use` prefix (`useSavedJobs.ts`)
- Utils：camelCase (`jobMetrics.ts`)
- Types：PascalCase (`JobRecord`)

## 🔍 关键设计决策

### 1. 为什么使用 localStorage 而不是数据库？

- 项目是静态工具，不需要服务器
- 数据仅存储在用户浏览器
- 简化部署和维护

### 2. 为什么分离三种页面类型？

- 文档系统需要独立的样式与内容数据层
- 主应用需要 MUI 主题支持

### 3. 为什么改为 Sanity 驱动的自定义文档？

- 便于非技术用户在线协作
- 能用结构化字段生成导航、摘要与状态流
- 与 Vercel webhook / ISR 集成更顺畅

## 📝 扩展建议

### 未来可能的改进

1. **数据同步**
  - 添加云端同步功能
  - 支持多设备访问
2. **更多计算功能**
  - 添加更多收入场景
  - 支持自定义税率
3. **导出功能**
  - 导出工作对比为 PDF
  - 导出数据为 Excel
4. **用户系统**
  - 添加用户账户
  - 数据云端存储

---

**最后更新**: 2024年