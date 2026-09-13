import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { parseFrontmatter } from "astro/markdown";
import { site } from "../../src/data/site";

// Keep the existing assertions tied to the editable homepage source.
const { frontmatter: home } = parseFrontmatter(
  readFileSync(
    new URL("../../src/content/homepage/home.md", import.meta.url),
    "utf8",
  ),
);

for (const width of [320, 390, 768, 1440]) {
  test(`navigation, layout and accessibility at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      home.headline,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
    expect(response?.headers()["x-robots-tag"]).toContain("noindex");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    for (const link of await page.locator("nav a, .button").all()) {
      const box = await link.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
      expect(box?.width).toBeGreaterThanOrEqual(44);
    }
    await page.getByRole("link", { name: "Explore the preview" }).click();
    await expect(page).toHaveURL(/#about$/);
    await expect(
      page.getByRole("heading", { name: home.aboutHeadline }),
    ).toBeInViewport();
    await page.getByRole("link", { name: "Home", exact: true }).click();
    await expect(page).toHaveURL("/");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

test("unknown routes return an accessible, non-indexable real 404", async ({
  page,
}) => {
  const response = await page.goto("/this-page-does-not-exist/");
  expect(response?.status()).toBe(404);
  expect(response?.headers()["x-robots-tag"]).toContain("noindex");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    site.notFound.heading,
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("link", { name: "Back to home" }).click();
  await expect(page).toHaveURL("/");
});

test("keyboard skip link and text at twice the default size remain usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  await page.getByRole("link", { name: "Explore the preview" }).click();
  await expect(page).toHaveURL(/#about$/);
});

test("all internal links and assets resolve", async ({ page, request }) => {
  await page.goto("/");
  const destinations = await page
    .locator("a[href], link[href]")
    .evaluateAll((elements) =>
      elements
        .map((element) => element.getAttribute("href"))
        .filter((href): href is string => Boolean(href)),
    );
  for (const destination of new Set(destinations)) {
    const url = new URL(destination, "http://127.0.0.1:8787");
    expect((await request.get(url.pathname)).status(), destination).toBe(200);
    if (url.hash) await expect(page.locator(url.hash)).toHaveCount(1);
  }
  expect(await (await request.get("/robots.txt")).text()).toContain(
    "Disallow: /",
  );
});

test("core content and navigation work without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:8787/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    home.headline,
  );
  await page.getByRole("link", { name: "Explore the preview" }).click();
  await expect(page).toHaveURL(/#about$/);
  await expect(
    page.getByRole("heading", { name: home.aboutHeadline }),
  ).toBeVisible();
  await context.close();
});
