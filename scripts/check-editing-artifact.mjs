import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readFile, readdir } from "node:fs/promises";
import { setTimeout as wait } from "node:timers/promises";
import { verifyArtifact } from "./build-artifact.mjs";

const directory = "dist/editing";
const expected = {
  commit: process.env.PREVIEW_COMMIT,
  target: "editing",
  branch: "development",
};
assert.match(expected.commit ?? "", /^[a-f0-9]{40}$/);
await verifyArtifact(directory, expected);
const config = JSON.parse(
  await readFile(`${directory}/server/wrangler.json`, "utf8"),
);
assert.equal(config.name, "leer-editing");
assert.equal(config.workers_dev, false);
assert.equal(config.preview_urls, false);
assert.equal(config.no_bundle, true);
assert.equal(config.main, "entry.mjs");
assert.equal(config.assets?.run_worker_first, true);
assert.equal(config.assets?.binding, "ASSETS");
assert.equal(config.assets?.directory, "../client");
assert.deepEqual(config.secrets?.required, ["TINA_TOKEN"]);
const adminFiles = await readdir(`${directory}/client/admin/assets`);
const adminScript = adminFiles.find((file) => /^index-.*\.js$/.test(file));
assert.ok(adminScript, "The hosted admin must have a JavaScript entry point.");

// Test the exact cloud artifact. There is no Access JWT or content secret in
// this process: the compiled local-authentication bypass must be absent.
const child = spawn(
  process.execPath,
  [
    "node_modules/wrangler/bin/wrangler.js",
    "dev",
    "--config",
    `${directory}/server/wrangler.json`,
    "--local",
    "--ip",
    "127.0.0.1",
    "--port",
    "8791",
    "--show-interactive-dev-session=false",
  ],
  {
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      TINA_TOKEN: "leer-nonsecret-runtime-canary",
      WRANGLER_SEND_METRICS: "false",
    },
  },
);
let log = "";
let startError;
child.on("error", (error) => {
  startError = error;
});
for (const stream of [child.stdout, child.stderr])
  stream.on("data", (chunk) => {
    log = `${log}${chunk}`.slice(-16_000);
  });
const origin = "http://127.0.0.1:8791";
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (startError || child.exitCode !== null)
      throw new Error("The artifact's local Worker failed to start.");
    try {
      const response = await fetch(origin, {
        redirect: "manual",
        signal: AbortSignal.timeout(1500),
      });
      await response.body?.cancel();
      ready = true;
      break;
    } catch {
      await wait(1000);
    }
  }
  assert.ok(ready, "The artifact's local Worker did not become ready.");
  const paths = [
    "/",
    "/edit/",
    "/admin",
    "/admin/",
    "/admin/index.html",
    `/admin/assets/${adminScript}`,
    "/editing-proof/",
    "/api/editing-reservation",
    "/tina-island/ProofPage",
    "/build.json",
    "/favicon.svg",
    "/uploads/unreleased.jpg",
  ];
  for (const path of paths) {
    const response = await fetch(`${origin}${path}`, {
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
    });
    await response.body?.cancel();
    assert.equal(response.status, 403, `${path} must require verified Access`);
    assert.match(
      response.headers.get("cache-control") ?? "",
      /private, no-store/,
    );
    assert.match(response.headers.get("x-robots-tag") ?? "", /noindex/);
  }
  for (const headers of [
    { "cf-access-authenticated-user-email": "admin@leer.education" },
    { "cf-access-jwt-assertion": "forged.jwt.value" },
  ]) {
    const response = await fetch(`${origin}/edit/`, {
      headers,
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
    });
    await response.body?.cancel();
    assert.equal(response.status, 403, "An unverified identity must not enter");
  }
  await verifyArtifact(directory, expected);
  console.log(
    "Verified cloud artifact identity, routing and 14 unauthenticated/forged-identity requests on the built Worker.",
  );
} catch (error) {
  // No real secrets are supplied to this local runtime check.
  process.stderr.write(log);
  throw error;
} finally {
  if (child.pid && child.exitCode === null) {
    const exited = once(child, "exit");
    process.kill(-child.pid, "SIGTERM");
    const stopped = await Promise.race([
      exited.then(() => true),
      wait(3000, false),
    ]);
    if (!stopped) process.kill(-child.pid, "SIGKILL");
  }
}
