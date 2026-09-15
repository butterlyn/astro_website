import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as wait } from "node:timers/promises";
import { verifyArtifact } from "./build-artifact.mjs";
import { cloudflareGet, verifyEditingAccess } from "./editing-access.mjs";
import { githubGet, verifyPreviewSource } from "./preview-source.mjs";

if (process.env.EDITING_PREVIEW_DEPLOYMENT !== "enabled")
  throw new Error("Editing preview deployment is paused.");
const commit = process.env.PREVIEW_COMMIT;
assert.match(commit ?? "", /^[a-f0-9]{40}$/);
const directory = "dist/editing";
const configPath = `${directory}/server/wrangler.json`;
const identity = await verifyArtifact(directory, {
  commit,
  target: "editing",
  branch: "development",
});
const config = JSON.parse(await readFile(configPath, "utf8"));
const protection = await verifyEditingAccess(config);
if (!process.env.TINA_TOKEN)
  throw new Error("The runtime Tina token is missing.");

// Only the tested artifact is uploaded. The content token stays outside it and
// is attached as a Worker secret in the same deployment, including first setup.
const temporary = await mkdtemp(join(tmpdir(), "leer-editing-secret-"));
try {
  const secretsFile = join(temporary, "secrets.json");
  await writeFile(
    secretsFile,
    JSON.stringify({ TINA_TOKEN: process.env.TINA_TOKEN }),
    { mode: 0o600 },
  );
  // Recheck the source after the Access audit, immediately before deployment.
  // This workflow is serialized and never cancels an in-flight deployment.
  await verifyPreviewSource(commit, githubGet);
  const result = spawnSync(
    process.execPath,
    [
      "node_modules/wrangler/bin/wrangler.js",
      "deploy",
      "--config",
      configPath,
      "--secrets-file",
      secretsFile,
      "--message",
      `development ${commit}`,
    ],
    {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
      maxBuffer: 32 * 1024 * 1024,
      timeout: 240_000,
    },
  );
  for (const output of [result.stdout, result.stderr]) {
    let text = output?.toString() ?? "";
    for (const value of [
      process.env.TINA_TOKEN,
      process.env.CLOUDFLARE_API_TOKEN,
      process.env.CLOUDFLARE_ACCOUNT_ID,
      process.env.GH_TOKEN,
    ].filter(Boolean))
      text = text.split(value).join("[REDACTED]");
    process.stdout.write(text);
  }
  if (result.error || result.status !== 0)
    throw new Error(
      "Editing deployment did not complete successfully. Inspect its recorded result before retrying.",
    );
} finally {
  await rm(temporary, { recursive: true, force: true });
}

const { result: domains } = await cloudflareGet("/workers/domains");
assert.ok(
  domains.some(
    (domain) =>
      domain.hostname === protection.hostname &&
      domain.service === "leer-editing",
  ),
  "The editing custom domain was not attached to the selected Worker",
);
const { result: alternate } = await cloudflareGet(
  "/workers/scripts/leer-editing/subdomain",
);
assert.equal(alternate.enabled, false, "workers.dev must remain disabled");
assert.equal(
  alternate.previews_enabled,
  false,
  "Version preview URLs must remain disabled",
);

let challenged = false;
for (let attempt = 0; attempt < 15; attempt++) {
  try {
    const response = await fetch(`https://${protection.hostname}/edit/`, {
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
    });
    await response.body?.cancel();
    const location = response.headers.get("location");
    if (response.status === 302 && location) {
      const login = new URL(location);
      challenged =
        login.hostname === protection.teamDomain &&
        login.pathname.startsWith("/cdn-cgi/access/login");
      if (challenged) break;
    }
  } catch {
    // Initial DNS/certificate propagation may precede the Access challenge.
  }
  await wait(4000);
}
assert.ok(
  challenged,
  "The deployed hostname has not returned its expected Access login challenge; inspect DNS/certificate propagation before retrying deployment",
);
console.log(
  `Deployed editing artifact ${identity.digest} from ${commit}; Access challenges unauthenticated entry. An authenticated hosted acceptance check is still required.`,
);
