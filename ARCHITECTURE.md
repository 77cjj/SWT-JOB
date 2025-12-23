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
- **Nextra** (v2.13.4) - 基于 Next.js 的文档框架
- **nextra-theme-docs** - 文档主题

### 内容管理
- **Decap CMS** (v3.0.0) - 无头内容管理系统（原 Netlify CMS）

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
│   │   ├── admin.tsx             # CMS 管理后台 (/admin)
│   │   │
│   │   ├── api/                  # API 路由
│   │   │   ├── auth.ts           # GitHub OAuth 认证入口
│   │   │   ├── callback.ts       # OAuth 回调处理
│   │   │   └── admin/
│   │   │       └── config.ts     # CMS 配置动态加载
│   │   │
│   │   └── docs/                 # 文档系统（Nextra）
│   │       ├── index.mdx         # 文档首页
│   │       ├── intro/            # 项目介绍
│   │       ├── preparation/      # 行前准备
│   │       ├── experience/      # 行中指南
│   │       ├── after/            # 行后归国
│   │       └── basics/           # 基础指南
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
├── public/
│   └── admin/                    # CMS 配置
│       ├── config.yml            # 生产环境配置
│       ├── config.local.yml      # 本地开发配置
│       └── index.html            # CMS 入口（未使用）
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

2. **文档页面** (`/docs/*`)
   - 使用 Nextra 主题
   - 独立的样式系统
   - 不支持 MUI 主题

3. **管理后台** (`/admin`)
   - 使用 Decap CMS
   - 无主题系统
   - 禁用 React StrictMode

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

**位置**: `src/pages/docs/`, `next.config.mjs`

**技术**: Nextra + MDX

**功能**:
- 基于文件的路由（每个 `.mdx` 文件是一个页面）
- 自动生成侧边栏导航
- 支持 Markdown 和 React 组件

### 5. 内容管理系统

**位置**: `src/pages/admin.tsx`, `public/admin/config.yml`

**技术**: Decap CMS + GitHub OAuth

**功能**:
- 可视化编辑文档（MDX 文件）
- 通过 GitHub API 直接提交到仓库
- 自动部署（Vercel）

**认证流程**:
```
用户点击登录 → GitHub OAuth → 获取 Token → 
postMessage 通信 → CMS 初始化 → 编辑界面
```

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

### 认证数据流

```
┌─────────────┐
│  /admin     │ 访问管理后台
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  /api/auth  │ 重定向到 GitHub
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  GitHub     │ 用户授权
└──────┬──────┘
       │
       ▼
┌─────────────┐
│/api/callback│ 获取 Token
└──────┬──────┘
       │
       ├──► postMessage (发送给 CMS)
       │
       └──► localStorage (fallback)
```

## 🗺️ 路由系统

### Next.js 文件路由

```
src/pages/
├── index.tsx          → /
├── swt.tsx            → /swt
├── admin.tsx          → /admin
└── docs/
    ├── index.mdx      → /docs
    ├── intro/
    │   └── guide.mdx  → /docs/intro/guide
    └── ...
```

### API 路由

```
src/pages/api/
├── auth.ts            → /api/auth?provider=github
├── callback.ts        → /api/callback?code=...
└── admin/
    └── config.ts      → /api/admin/config
```

### 路由重写（next.config.mjs）

```javascript
/admin/config.yml → /api/admin/config
/admin/config.local.yml → /api/admin/config
/config.yml → /api/admin/config
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
// 主应用页面：MUI 主题
if (isAdmin || isDocs) {
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
npm run dev:cms      # 启动开发服务器 + CMS 代理（已废弃）
```

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

### 环境变量

**开发环境** (`.env.local`):
```env
OAUTH_CLIENT_ID=...
OAUTH_CLIENT_SECRET=...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**生产环境** (Vercel):
- `OAUTH_CLIENT_ID`
- `OAUTH_CLIENT_SECRET`
- `NEXT_PUBLIC_BASE_URL` (可选)

## 🔐 安全与认证

### GitHub OAuth 流程

1. 用户访问 `/admin`
2. 点击登录 → `/api/auth?provider=github`
3. 重定向到 GitHub 授权页面
4. 授权后回调 → `/api/callback?code=...`
5. 获取 access_token
6. 通过 postMessage 发送给 CMS
7. CMS 使用 token 访问 GitHub API

### 安全措施

- Token 不存储在客户端（仅用于 API 调用）
- postMessage 通信验证
- 环境变量保护敏感信息

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

- 文档系统（Nextra）需要独立的样式
- CMS 需要避免 React StrictMode 冲突
- 主应用需要 MUI 主题支持

### 3. 为什么使用 Nextra 而不是自定义文档？

- Nextra 提供完整的文档功能
- 自动生成导航和搜索
- 支持 MDX（Markdown + React）

### 4. 为什么使用 Decap CMS？

- 无服务器架构
- 直接提交到 GitHub
- 与 Vercel 自动部署集成

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

