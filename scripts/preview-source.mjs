import { execFileSync } from "node:child_process";
import { appendFile, readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export function previewCommit(env, event) {
  if (env.GITHUB_REPOSITORY !== "butterlyn/astro_website")
    throw new Error("Editing previews run only in the selected repository.");
  let commit;
  if (env.GITHUB_EVENT_NAME === "workflow_dispatch") {
    if (
      env.GITHUB_REF !== "refs/heads/development" ||
      env.GITHUB_ACTOR !== "butterlyn"
    )
      throw new Error("Manual previews require the owner and development.");
    commit = env.GITHUB_SHA;
  } else if (env.GITHUB_EVENT_NAME === "workflow_run") {
    const run = event.workflow_run;
    if (
      run?.event !== "push" ||
      run.conclusion !== "success" ||
      run.head_branch !== "development" ||
      run.head_repository?.full_name !== "butterlyn/astro_website" ||
      run.path !== ".github/workflows/checks.yml"
    )
      throw new Error(
        "Only successful trusted development checks trigger previews.",
      );
    commit = run.head_sha;
  } else throw new Error("This event cannot build an editing preview.");
  if (!/^[a-f0-9]{40}$/.test(commit ?? ""))
    throw new Error("The preview needs an exact source commit.");
  return commit;
}

export async function verifyPreviewSource(commit, get) {
  const head = await get("/git/ref/heads/development");
  if (head.object?.sha !== commit)
    throw new Error("This preview is stale: development has moved.");
  const { workflow_runs: runs } = await get(
    `/actions/runs?head_sha=${commit}&event=push&per_page=100`,
  );
  for (const path of [
    ".github/workflows/setup-checks.yml",
    ".github/workflows/checks.yml",
  ]) {
    const run = runs
      ?.filter(
        (item) =>
          item.path === path &&
          item.head_sha === commit &&
          item.head_branch === "development" &&
          item.event === "push" &&
          item.repository?.full_name === "butterlyn/astro_website" &&
          item.head_repository?.full_name === "butterlyn/astro_website",
      )
      .sort((a, b) => b.id - a.id)[0];
    if (run?.status !== "completed" || run.conclusion !== "success")
      throw new Error(`The latest trusted ${path} run must pass at ${commit}.`);
  }
}

export async function githubGet(path) {
  if (!process.env.GH_TOKEN) throw new Error("Missing GitHub read token.");
  const response = await fetch(
    `https://api.github.com/repos/butterlyn/astro_website${path}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2026-03-10",
      },
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(
      `GitHub source verification failed (HTTP ${response.status}).`,
    );
  }
  return response.json();
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const event = JSON.parse(
    await readFile(process.env.GITHUB_EVENT_PATH, "utf8"),
  );
  const commit = previewCommit(process.env, event);
  if (
    execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim() !==
    commit
  )
    throw new Error("The checkout differs from the requested preview commit.");
  await verifyPreviewSource(commit, githubGet);
  if (process.env.GITHUB_OUTPUT)
    await appendFile(process.env.GITHUB_OUTPUT, `commit=${commit}\n`);
  console.log(`Verified trusted development checks at ${commit}.`);
}
