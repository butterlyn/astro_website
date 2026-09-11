import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { cleanupWorkers } from "./preview-guard.ts";

export async function cleanupPreview({
  env = process.env,
  fetchImpl = globalThis.fetch,
  deleteWorker = (worker: string) => {
    execFileSync("pnpm", ["exec", "wrangler", "delete", worker], {
      stdio: "inherit",
      timeout: 120_000,
    });
  },
  log = console.log,
} = {}) {
  const account = env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const token = env.CLOUDFLARE_API_TOKEN?.trim();
  if (!account || !/^[a-f0-9]{32}$/i.test(account) || !token) {
    throw new Error(
      "Set the existing Cloudflare account and token repository secrets.",
    );
  }

  async function status(worker: string) {
    try {
      const response = await fetchImpl(
        `https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${worker}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          redirect: "error",
          signal: AbortSignal.timeout(30_000),
        },
      );
      await response.body?.cancel();
      return response.status;
    } catch {
      throw new Error(
        "Could not check preview Worker status. Check Cloudflare connectivity and retry cleanup.",
      );
    }
  }

  for (const worker of cleanupWorkers) {
    const before = await status(worker);
    if (before !== 200 && before !== 404) {
      throw new Error(
        `Cannot check ${worker} (HTTP ${before}). Check account access before retrying cleanup.`,
      );
    }
    if (before === 200) {
      deleteWorker(worker);
      const after = await status(worker);
      if (after !== 404) {
        throw new Error(
          `${worker} absence is not confirmed (HTTP ${after}). Check deletion permissions and retry cleanup.`,
        );
      }
    }
    log(`PASS: Cloudflare confirms ${worker} is absent (HTTP 404).`);
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await cleanupPreview();
}
