import { defineConfig, devices } from "@playwright/test";

/**
 * 首次运行前执行: npx playwright install
 * 本地服务: PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm run test:e2e
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000",
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
  },
});
