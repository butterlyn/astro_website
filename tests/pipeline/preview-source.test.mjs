import assert from "node:assert/strict";
import test from "node:test";
import {
  previewCommit,
  verifyPreviewSource,
} from "../../scripts/preview-source.mjs";

const sha = "a".repeat(40);
const repo = { full_name: "butterlyn/astro_website" };
const env = {
  GITHUB_REPOSITORY: repo.full_name,
  GITHUB_EVENT_NAME: "workflow_run",
};
const run = {
  event: "push",
  conclusion: "success",
  status: "completed",
  head_branch: "development",
  repository: repo,
  head_repository: repo,
  path: ".github/workflows/checks.yml",
  head_sha: sha,
};

test("preview source excludes PRs, forks, failed checks and unrelated workflows", () => {
  assert.equal(previewCommit(env, { workflow_run: run }), sha);
  for (const change of [
    { event: "pull_request" },
    { head_branch: "main" },
    { head_repository: { full_name: "someone/astro_website" } },
    { conclusion: "failure" },
    { path: ".github/workflows/unrelated.yml" },
    { head_sha: "development" },
  ])
    assert.throws(() =>
      previewCommit(env, { workflow_run: { ...run, ...change } }),
    );
  assert.throws(() =>
    previewCommit({ ...env, GITHUB_EVENT_NAME: "pull_request" }, {}),
  );
  const manual = {
    ...env,
    GITHUB_EVENT_NAME: "workflow_dispatch",
    GITHUB_ACTOR: "butterlyn",
    GITHUB_REF: "refs/heads/development",
    GITHUB_SHA: sha,
  };
  assert.equal(previewCommit(manual, {}), sha);
  assert.throws(() =>
    previewCommit({ ...manual, GITHUB_REF: "refs/heads/main" }, {}),
  );
  assert.throws(() =>
    previewCommit({ ...manual, GITHUB_ACTOR: "someone" }, {}),
  );
});

test("preview verification needs both successful push workflows at the current revision", async () => {
  const passing = [
    { ...run, id: 1 },
    { ...run, id: 2, path: ".github/workflows/setup-checks.yml" },
  ];
  const get =
    (runs, head = sha) =>
    async (path) =>
      path === "/git/ref/heads/development"
        ? { object: { sha: head } }
        : { workflow_runs: runs };
  await verifyPreviewSource(sha, get(passing));
  await assert.rejects(
    verifyPreviewSource(sha, get(passing, "b".repeat(40))),
    /stale/,
  );
  for (const runs of [
    [],
    passing.slice(0, 1),
    passing.map((item) => ({ ...item, event: "pull_request" })),
    passing.map((item) => ({ ...item, head_sha: "b".repeat(40) })),
    passing.map((item) => ({ ...item, conclusion: "failure" })),
    [...passing, { ...run, id: 3, status: "in_progress", conclusion: null }],
  ])
    await assert.rejects(verifyPreviewSource(sha, get(runs)), /latest trusted/);
});
