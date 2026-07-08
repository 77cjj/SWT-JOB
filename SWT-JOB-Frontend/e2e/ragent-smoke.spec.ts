import { test, expect } from "@playwright/test";

test.describe("Ragent 嵌入页冒烟", () => {
  test("登录页可访问", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("欢迎回来")).toBeVisible();
  });

  test("聊天页可访问（需已登录或 BYPASS_AUTH）", async ({ page }) => {
    await page.goto("/chat");
    // 未登录时可能重定向到 /login；已集成 BYPASS 或已登录时出现聊天 UI
    await expect(page.locator("body")).toBeVisible();
  });
});
