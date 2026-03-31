# SWT Helper

> 一个专为 Summer Work & Travel (SWT) 项目参与者设计的智能工作选择工具

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Material-UI](https://img.shields.io/badge/MUI-007FFF?style=flat-square&logo=mui&logoColor=white)](https://mui.com/)

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

- 使用 **TinaCMS** 作为本地文档编辑后台
- 文档正文继续保存在 `src/pages/docs/**/*.mdx`
- Nextra 直接渲染这些 MDX 文件，不额外引入内容同步层
- 各级 `_meta.json` 仍手工维护，不在当前一期纳入 Tina 管理

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

2. **安装依赖**

```bash
npm install
```

3. **启动开发服务器**

```bash
npm run dev
```

4. **访问应用**

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

5. **访问 Tina 管理后台**

打开 [http://localhost:3000/admin/index.html](http://localhost:3000/admin/index.html)

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
│   │   ├── docs/            # 文档页面（Nextra）
│   │   └── api/             # API 路由
│   ├── hooks/               # React Hooks
│   ├── utils/               # 工具函数
│   │   ├── jobMetrics.ts    # 收入计算逻辑
│   │   └── stateTax.ts      # 州税计算
│   ├── data/                # 静态数据
│   │   ├── tax.json         # 税率数据
│   │   └── usCities.ts      # 城市数据
│   └── types/               # TypeScript 类型定义
├── tina/
│   ├── config.ts            # TinaCMS 内容模型
│   └── database.ts          # TinaCMS 本地数据层
├── package.json
└── README.md
```

## 🛠️ 技术栈

- **框架**: [Next.js](https://nextjs.org/) - React 全栈框架
- **语言**: [TypeScript](https://www.typescriptlang.org/) - 类型安全
- **UI 库**: [Material-UI (MUI)](https://mui.com/) - React 组件库
- **样式**: [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- **文档**: [Nextra](https://nextra.site/) - 基于 Next.js 的文档框架
- **CMS**: [TinaCMS](https://tina.io/) - Git-based 文档编辑后台
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

- Tina 当前只管理 `src/pages/docs/**/*.mdx`
- 文档导航仍由 `src/pages/docs/_meta.json` 及各子目录 `_meta.json` 控制
- 如果新增文档后需要出现在侧边栏，请同步更新对应 `_meta.json`

### 后续可选增强

- 如果后续希望让编辑者也能管理导航，建议为文档逐步补充 `title`、`section`、`order` 等 frontmatter
- 再基于这些字段生成 `_meta.json`，而不是直接把 `_meta.json` 暴露给 Tina 编辑

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
