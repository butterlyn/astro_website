import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("hosted entry points reject unverified identities, including static assets", async ({
  request,
}) => {
  for (const path of [
    "/",
    "/edit/",
    "/admin/index.html",
    "/favicon.svg",
    "/editing-proof/",
    "/tina-island/page",
    "/api/editing-reservation",
  ]) {
    const response = await request.get(path, {
      headers: {
        host: "edit.leer.education",
        "cf-access-authenticated-user-email": "admin@leer.education",
      },
    });
    expect(response.status()).toBe(403);
    expect(await response.text()).toContain(
      "Private editing access has not been verified",
    );
    expect(response.headers()["cache-control"]).toContain("no-store");
  }
});

test("real Durable Object serializes contenders, preserves review, and rejects stale handoff", async ({
  request,
}) => {
  const a = randomUUID();
  const b = randomUUID();
  const send = (
    session: string,
    action: string,
    epoch?: number,
    reconciled = false,
  ) =>
    request.post("/api/editing-reservation", {
      headers: {
        origin: "http://127.0.0.1:4321",
        "x-editing-session": session,
        "content-type": "application/json",
      },
      data: { action, epoch, reconciled },
    });
  expect((await send(a, "recover", undefined, true)).status()).toBe(200);
  expect((await send(a, "resume", undefined, true)).status()).toBe(200);
  const results = await Promise.all([send(a, "acquire"), send(b, "acquire")]);
  expect(results.map((result) => result.status()).sort()).toEqual([200, 409]);
  const winner = results[0]?.ok() ? a : b;
  const loser = winner === a ? b : a;
  const success = results.find((result) => result.ok());
  if (!success) throw new Error("No editor acquired ownership.");
  const acquired = await success.json();
  expect((await request.get("/")).status()).toBe(200);
  expect((await send(winner, "release", acquired.epoch)).status()).toBe(400);
  expect((await send(winner, "release", acquired.epoch, true)).status()).toBe(
    200,
  );
  expect((await send(loser, "acquire")).status()).toBe(200);
  expect((await send(winner, "check", acquired.epoch)).status()).toBe(409);
  await send(a, "recover", undefined, true);
  await send(a, "resume", undefined, true);
});

test("review and editable regions render on workerd with private responses", async ({
  page,
  request,
}) => {
  const response = await page.goto("/editing-proof/?tina-edit=1");
  expect(response?.status()).toBe(200);
  expect(response?.headers()["cache-control"]).toContain("no-store");
  await expect(page.locator("[data-section-id=proof-features]")).toBeVisible();
  await expect(page.locator("[data-tina-island]")).toHaveCount(3);
  const prime = await request.post("/tina-island/page", {
    headers: {
      origin: "http://127.0.0.1:4321",
      "content-type": "application/x-tina-preview+json",
      "x-tina-prime": "1",
    },
    data: "{}",
  });
  expect(prime.status()).toBe(200);
  const primed = await prime.text();
  expect(primed).toContain("data-tina-form");
  await page.setContent(primed);
  const payload = await page
    .locator("[data-tina-form]")
    .getAttribute("data-tina-form");
  if (!payload) throw new Error("No Tina form metadata was registered.");
  const form = JSON.parse(payload);
  const savedTitle = form.data.proofPage.title;
  const overlayTitle = `Unsaved overlay ${randomUUID()}`;
  form.data.proofPage.title = overlayTitle;
  form.data.proofPage.sections[0].items.reverse();
  const overlay = await request.post("/tina-island/page", {
    headers: {
      origin: "http://127.0.0.1:4321",
      "content-type": "application/x-tina-preview+json",
    },
    data: { [form.id]: form.data },
  });
  expect(overlay.status()).toBe(200);
  expect(overlay.headers()["cache-control"]).toContain("no-store");
  const rendered = await overlay.text();
  expect(rendered).toContain(overlayTitle);
  expect(rendered.indexOf("Second example")).toBeLessThan(
    rendered.indexOf("First example"),
  );
  // A separate ordinary request still sees saved content, never this overlay.
  await page.goto("/editing-proof/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(savedTitle);
  await expect(
    page.locator("[data-section-id=proof-features] h3").first(),
  ).toHaveText("First example");
});

test("two browser tabs see an occupied editor, and explicit handoff loads the next editor", async ({
  browser,
}) => {
  const first = await browser.newContext();
  const second = await browser.newContext();
  try {
    const a = await first.newPage();
    const b = await second.newPage();
    await a.goto("/edit/");
    await a
      .getByRole("button", { name: "Reserve and load saved content" })
      .click();
    await expect(a.locator("#editor")).toBeVisible();
    await b.goto("/edit/");
    await expect(b.getByRole("status")).toContainText("occupied");
    await expect(
      b.getByRole("button", { name: "Reserve and load saved content" }),
    ).toBeDisabled();
    await a.locator("#reconciled").check();
    await a.getByRole("button", { name: "Close editor and hand off" }).click();
    await expect(a.locator("#editor")).toBeHidden();
    await b.reload();
    await b
      .getByRole("button", { name: "Reserve and load saved content" })
      .click();
    await expect(b.locator("#editor")).toBeVisible();
    await b.locator("#reconciled").check();
    await b.getByRole("button", { name: "Close editor and hand off" }).click();
  } finally {
    await first.close();
    await second.close();
  }
});

test("Tina visually previews unsaved text, saves Markdown and reopens it; stale saves retain text", async ({
  page,
  request,
}) => {
  test.setTimeout(60_000);
  const fixture = "content/proof/pages/proof.md";
  const original = await readFile(fixture, "utf8");
  const title = `Verified browser save ${randomUUID()}`;
  const recovery = randomUUID();
  const recover = (action: string) =>
    request.post("/api/editing-reservation", {
      headers: {
        origin: "http://127.0.0.1:4321",
        "content-type": "application/json",
        "x-editing-session": recovery,
      },
      data: { action, reconciled: true },
    });
  try {
    await page.goto("/editing-proof/");
    const savedHeading = page.getByRole("heading", { level: 1 });
    await expect(savedHeading).toBeVisible();
    const savedTitle = (await savedHeading.innerText()).trim();
    expect(savedTitle).not.toBe("");
    await page.goto("/edit/");
    await page
      .getByRole("button", { name: "Reserve and load saved content" })
      .click();
    const editor = page.frameLocator("#editor");
    await page.locator("#editor").scrollIntoViewIfNeeded();
    await editor
      .getByRole("button", { name: "Enter Edit Mode", exact: true })
      .click();
    await editor.getByRole("button", { name: "Open navigation menu" }).click();
    await editor
      .getByRole("link", { name: "Integration proof pages", exact: true })
      .click();
    await editor.getByText(savedTitle, { exact: true }).click();
    const input = editor.locator("input[name=title]");
    await expect(input).toHaveValue(savedTitle);
    await input.fill(title);
    await expect(
      editor.frameLocator("iframe").getByRole("heading", { level: 1 }),
    ).toHaveText(title);
    expect(await readFile(fixture, "utf8")).toBe(original);
    const savedReview = await request.get("/editing-proof/");
    expect(await savedReview.text()).not.toContain(title);

    const ownershipCheck = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/editing-reservation") &&
        response.request().postDataJSON()?.action === "check",
    );
    await editor.getByRole("button", { name: "Save", exact: true }).click();
    expect((await ownershipCheck).status()).toBe(200);
    await expect.poll(() => readFile(fixture, "utf8")).toContain(title);
    const admin = page
      .frames()
      .find((frame) => frame.url().includes("/admin/index.html"));
    if (!admin) throw new Error("Admin frame is missing.");
    await admin.goto(admin.url());
    await expect(input).toHaveValue(title);
    const save = editor.getByRole("button", { name: "Save", exact: true });
    await expect(save).toBeDisabled();
    await expect(
      editor.frameLocator("iframe").getByRole("heading", { level: 1 }),
    ).toHaveText(title);

    // Recovery invalidates the captured epoch without destroying the form.
    await input.fill("Keep this unsaved recovery text");
    await expect(
      editor.frameLocator("iframe").getByRole("heading", { level: 1 }),
    ).toHaveText("Keep this unsaved recovery text");
    await expect(save).toBeEnabled();
    expect((await recover("recover")).status()).toBe(200);
    const staleCheck = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/editing-reservation") &&
        response.request().postDataJSON()?.action === "check",
    );
    await save.click();
    expect((await staleCheck).status()).toBe(423);
    await expect(input).toHaveValue("Keep this unsaved recovery text");
    expect(await readFile(fixture, "utf8")).not.toContain(
      "Keep this unsaved recovery text",
    );
    const retained = await page.evaluate(() =>
      sessionStorage.getItem("leer.unsaved-backup"),
    );
    expect(retained).toContain("Keep this unsaved recovery text");
  } finally {
    try {
      if (!page.isClosed()) await page.goto("about:blank");
      await recover("recover");
      await recover("resume");
    } finally {
      // Browser timeout/closure must never prevent restoring authored content.
      await writeFile(fixture, original);
    }
  }
});
