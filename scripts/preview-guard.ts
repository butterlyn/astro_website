import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const previewBranch = "dummy/pipeline-proof-20260912";
export const previewWorker = "leer-preview";
export const cleanupWorkers = [
  previewWorker,
  "astro-website-dummy-20260912",
] as const;
export const previewRepository = "butterlyn/astro_website";

type GuardInput = {
  event: string | undefined;
  ref: string | undefined;
  repository: string | undefined;
  commit: string | undefined;
  currentCommit: string;
  cleanupMarker: boolean;
  operation: string | undefined;
};

export function mayWritePreview(input: GuardInput): boolean {
  if (
    input.event !== "push" ||
    input.ref !== `refs/heads/${previewBranch}` ||
    input.repository !== previewRepository ||
    !input.commit ||
    !/^[a-f0-9]{40}$/.test(input.commit) ||
    !["deploy", "cleanup"].includes(input.operation ?? "") ||
    input.cleanupMarker !== (input.operation === "cleanup")
  ) {
    throw new Error(
      "Refusing a write outside the trusted preview branch and marker state.",
    );
  }
  return input.commit === input.currentCommit;
}

export function assertPreviewConfig(config: Record<string, unknown>) {
  if (
    config.name !== previewWorker ||
    config.workers_dev !== true ||
    ["main", "route", "routes", "env", "build"].some((key) => key in config) ||
    JSON.stringify(config.assets) !==
      JSON.stringify({
        directory: "./dist",
        html_handling: "auto-trailing-slash",
        not_found_handling: "404-page",
      })
  ) {
    throw new Error(
      "Refusing to mutate an unexpected Worker or hosting configuration.",
    );
  }
}

async function main() {
  assertPreviewConfig(JSON.parse(readFileSync("wrangler.jsonc", "utf8")));
  if (!process.env.GH_TOKEN || !process.env.GITHUB_OUTPUT) {
    throw new Error("Run this guard in the trusted GitHub Actions job.");
  }
  const response = await fetch(
    `https://api.github.com/repos/${previewRepository}/git/ref/heads/${previewBranch}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!response.ok)
    throw new Error(
      `Cannot verify current preview branch: HTTP ${response.status}.`,
    );
  const data = (await response.json()) as { object?: { sha?: string } };
  if (!data.object?.sha)
    throw new Error("GitHub did not return the current commit.");
  const current = mayWritePreview({
    event: process.env.GITHUB_EVENT_NAME,
    ref: process.env.GITHUB_REF,
    repository: process.env.GITHUB_REPOSITORY,
    commit: process.env.GITHUB_SHA,
    currentCommit: data.object.sha,
    cleanupMarker: existsSync(".cleanup-preview"),
    operation: process.argv[2],
  });
  appendFileSync(process.env.GITHUB_OUTPUT, `current=${current}\n`);
  console.log(
    current
      ? "Current trusted preview commit verified."
      : "Skipping stale commit; a newer push controls this preview.",
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await main();
}
