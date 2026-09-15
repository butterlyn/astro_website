import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/editing",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:4321",
    browserName: "chromium",
    trace: "off",
    screenshot: "off",
  },
  webServer: {
    command: "pnpm dev:tina",
    url: "http://127.0.0.1:4321/edit/",
    reuseExistingServer: false,
    timeout: 120_000,
    env: { WRANGLER_SEND_METRICS: "false" },
  },
});
