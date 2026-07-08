import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Toast } from "@/components/common/Toast";

/**
 * 嵌入 SWT Next 应用时路由由 `src/pages` 承担；本文件仅用于非 Next 场景或遗留 Vite 入口。
 */
export default function App() {
  return (
    <ErrorBoundary>
      <Toast />
    </ErrorBoundary>
  );
}
