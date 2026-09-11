import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  assertPreviewConfig,
  mayWritePreview,
  previewBranch,
  previewRepository,
} from "../../scripts/preview-guard.ts";

const input = {
  event: "push",
  ref: `refs/heads/${previewBranch}`,
  repository: previewRepository,
  commit: "a".repeat(40),
  currentCommit: "a".repeat(40),
  cleanupMarker: false,
  operation: "deploy",
};

test("only the current trusted push can deploy", () => {
  assert.equal(mayWritePreview(input), true);
  for (const changed of [
    { event: "pull_request" },
    { ref: "refs/heads/main" },
    { repository: "someone/else" },
    { commit: undefined },
    { operation: "unknown" },
  ])
    assert.throws(() => mayWritePreview({ ...input, ...changed }));
});

test("a cleanup push or later branch deletion cannot be undone by a stale deployment", () => {
  assert.equal(
    mayWritePreview({ ...input, currentCommit: "b".repeat(40) }),
    false,
  );
  assert.equal(mayWritePreview({ ...input, currentCommit: "" }), false);
});

test("cleanup and deployment require opposite marker states", () => {
  assert.throws(() => mayWritePreview({ ...input, cleanupMarker: true }));
  assert.throws(() => mayWritePreview({ ...input, operation: "cleanup" }));
  assert.equal(
    mayWritePreview({ ...input, cleanupMarker: true, operation: "cleanup" }),
    true,
  );
});

test("the Worker guard rejects production names, routes and custom builds", () => {
  const config = JSON.parse(readFileSync("wrangler.jsonc", "utf8"));
  assert.doesNotThrow(() => assertPreviewConfig(config));
  for (const changed of [
    { name: "production" },
    { routes: ["example.com/*"] },
    { workers_dev: false },
    { build: { command: "pnpm build" } },
    { assets: { directory: "./untested" } },
  ])
    assert.throws(() => assertPreviewConfig({ ...config, ...changed }));
});
