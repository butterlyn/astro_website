import { mkdir, writeFile } from "node:fs/promises";
import { chromium, expect, test } from "@playwright/test";
import lighthouse from "lighthouse";

test("record a mobile Lighthouse report and review screenshots", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await mkdir("reports", { recursive: true });
  for (const [name, width] of [
    ["mobile", 390],
    ["desktop", 1440],
  ] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.screenshot({ path: `reports/${name}.png`, fullPage: true });
  }
  const browser = await chromium.launch({
    args: ["--remote-debugging-port=9222"],
  });
  try {
    const result = await lighthouse("http://127.0.0.1:8787/", {
      port: 9222,
      output: ["html", "json"],
      logLevel: "error",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    });
    expect(result).toBeDefined();
    if (!result) throw new Error("Lighthouse did not return a report.");
    expect(result.lhr.runtimeError).toBeUndefined();
    const reports = result.report as string[];
    if (!reports[0] || !reports[1])
      throw new Error("Lighthouse did not generate both report formats.");
    await writeFile("reports/lighthouse-mobile.html", reports[0]);
    await writeFile("reports/lighthouse-mobile.json", reports[1]);
    console.log(
      "Lighthouse mobile scores:",
      Object.fromEntries(
        Object.entries(result.lhr.categories).map(([key, category]) => [
          key,
          category.score,
        ]),
      ),
    );
  } finally {
    await browser.close();
  }
});
