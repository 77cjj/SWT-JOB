import type { ReactNode } from 'react';

/**
 * App Router 根布局（仅作用于 src/app 下路由，如 /studio）。
 * Pages Router 仍使用 src/pages/_app.tsx。
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
