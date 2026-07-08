import type { User } from "@/types";

export type AdminNavFlatItem = {
  path: string;
  label: string;
  /**
   * 可访问该菜单项的角色白名单；省略时仅 `admin` 可见（见 {@link getVisibleAdminNavItems}）
   */
  roles?: string[];
};

/** 与 `AdminLayout` 侧栏一致的后台入口（扁平列表，用于顶栏用户菜单等） */
export const ADMIN_NAV_FLAT_ITEMS: AdminNavFlatItem[] = [
  { path: "/admin/dashboard", label: "Dashboard" },
  { path: "/admin/knowledge", label: "知识库管理" },
  { path: "/admin/intent-tree", label: "意图树配置" },
  { path: "/admin/intent-list", label: "意图列表" },
  { path: "/admin/ingestion?tab=pipelines", label: "流水线管理" },
  { path: "/admin/ingestion?tab=tasks", label: "流水线任务" },
  { path: "/admin/mappings", label: "关键词映射" },
  { path: "/admin/traces", label: "链路追踪" },
  { path: "/admin/users", label: "用户管理" },
  { path: "/admin/sample-questions", label: "示例问题" },
  { path: "/admin/settings", label: "系统设置" }
];

export function getVisibleAdminNavItems(user: User | null): AdminNavFlatItem[] {
  if (!user) return [];
  return ADMIN_NAV_FLAT_ITEMS.filter((item) => {
    const allowed = item.roles ?? ["admin"];
    return allowed.includes(user.role);
  });
}
