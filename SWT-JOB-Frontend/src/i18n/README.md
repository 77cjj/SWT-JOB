# 国际化 (i18n) 使用指南

## 概述

项目已集成多语言支持系统，目前支持中文（zh）和英文（en），设计为可扩展架构，便于添加新语言。

## 架构

```
src/i18n/
├── types.ts              # 语言类型定义
├── locales/
│   ├── zh.ts            # 中文翻译
│   └── en.ts            # 英文翻译
├── index.ts             # 翻译工具函数
└── README.md           # 本文件
```

## 使用方法

### 1. 在组件中使用翻译

```tsx
import { useI18n } from '../../context/I18nContext';

function MyComponent() {
  const { t, tWithParams } = useI18n();
  
  return (
    <div>
      <h1>{t('home.title')}</h1>
      <p>{tWithParams('historicalJobs.foundJobs', { count: 10 })}</p>
    </div>
  );
}
```

### 2. 切换语言

```tsx
import { useI18n } from '../../context/I18nContext';
import { SUPPORTED_LANGUAGES } from '../../i18n/types';

function LanguageSwitcher() {
  const { language, setLanguage } = useI18n();
  
  return (
    <select value={language} onChange={(e) => setLanguage(e.target.value)}>
      {SUPPORTED_LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.nativeName}
        </option>
      ))}
    </select>
  );
}
```

### 3. 添加新语言

1. 在 `src/i18n/locales/` 创建新语言文件，例如 `ja.ts`（日语）
2. 复制 `zh.ts` 或 `en.ts` 作为模板
3. 翻译所有键值对
4. 在 `src/i18n/types.ts` 中添加语言配置：

```typescript
export type Language = 'zh' | 'en' | 'ja'; // 添加新语言

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' }, // 添加新语言
];
```

5. 在 `src/i18n/index.ts` 中导入并导出：

```typescript
import { ja } from './locales/ja';

export const translations = {
  zh,
  en,
  ja, // 添加新语言
} as const;
```

## 翻译键命名规范

使用点号分隔的层级结构：

- `common.*` - 通用文本（保存、取消等）
- `nav.*` - 导航相关
- `home.*` - 首页相关
- `jobForm.*` - 工作表单相关
- `historicalJobs.*` - 历年岗位相关
- `errors.*` - 错误信息

## 参数替换

使用 `tWithParams` 进行参数替换：

```tsx
// 翻译文件
foundJobs: '共找到 {count} 个岗位'

// 使用
{tWithParams('historicalJobs.foundJobs', { count: 10 })}
// 输出: "共找到 10 个岗位"
```

## 语言持久化

语言选择会自动保存到 `localStorage`，下次访问时会自动恢复。

## 注意事项

1. 所有用户可见的文本都应使用翻译函数
2. 翻译键名应使用英文，便于理解
3. 添加新翻译时，确保所有语言文件都有对应的键
4. 如果某个语言缺少翻译，系统会回退到中文

