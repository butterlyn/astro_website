import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:8787",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    ...(["chromium", "firefox", "webkit"] as const).map((browserName) => ({
      name: browserName,
      testMatch: "site.spec.ts",
      use: { browserName },
    })),
    {
      name: "lighthouse",
      testMatch: "lighthouse.spec.ts",
      use: { browserName: "chromium" },
    },
  ],
  webServer: {
    command: "pnpm preview:cloudflare",
    url: "http://127.0.0.1:8787",
    reuseExistingServer: false,
    timeout: 120_000,
    env: { WRANGLER_SEND_METRICS: "false" },
  },
});
