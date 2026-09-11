import assert from "node:assert/strict";
import { previewWorker } from "./preview-guard.ts";

const [origin, commit] = process.argv.slice(2);
if (!origin || !commit)
  throw new Error("Pass the preview origin and expected build commit.");
const base = new URL(origin);
assert.match(
  base.hostname,
  new RegExp(`^${previewWorker}\\.[a-z0-9-]+\\.workers\\.dev$`),
);
assert.equal(base.protocol, "https:");

async function get(path: string) {
  return fetch(new URL(path, base), {
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
}

// Retry only for initial workers.dev propagation; content assertions still fail the job.
let home: Response | undefined;
for (let attempt = 0; attempt < 6; attempt++) {
  try {
    home = await get("/");
    if (home.status === 200) break;
  } catch {
    // Network errors during propagation are retried without logging request internals.
  }
  await new Promise((resolve) => setTimeout(resolve, 5000));
}
assert.equal(home?.status, 200, "Homepage must return HTTP 200.");
assert.ok(home?.headers.get("x-robots-tag")?.includes("noindex"));
const html = await home.text();
assert.match(html, /<meta\s+name="robots"\s+content="noindex/);
assert.match(html, /A little space for what comes next/);
const stylesheet = html.match(/href="([^"]+\.css)"/)?.[1];
assert.ok(stylesheet, "The built page must link to its stylesheet.");
assert.equal((await get(stylesheet)).status, 200);
assert.equal((await get("/favicon.svg")).status, 200);
assert.match(await (await get("/robots.txt")).text(), /Disallow: \//);
const missing = await get("/pipeline-smoke-missing-page/");
assert.equal(missing.status, 404);
assert.ok(missing.headers.get("x-robots-tag")?.includes("noindex"));
assert.match(await missing.text(), /A little off the path/);
const build = (await (await get("/build.json")).json()) as { commit?: string };
assert.equal(
  build.commit,
  commit,
  "The live artifact must be from the validated commit.",
);
console.log(
  `PASS: ${base.origin} — home, assets, robots, real 404 and commit ${commit}.`,
);
