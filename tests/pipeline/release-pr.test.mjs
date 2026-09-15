import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyComparison,
  ensureReleasePR,
  githubAPI,
  GitHubError,
  repository,
} from "../../scripts/release-pr.mjs";

const main = "a".repeat(40);
const development = "b".repeat(40);
const pr = {
  number: 7,
  state: "open",
  head: { ref: "development", repo: { full_name: repository } },
  base: { ref: "main", repo: { full_name: repository } },
};
const comparison = {
  status: "ahead",
  ahead_by: 1,
  behind_by: 0,
  files: [{ filename: "content/pages/home.md" }],
  base_commit: { sha: main },
  merge_base_commit: { sha: main },
};

function fixture(options = {}) {
  const calls = [];
  let listings = 0;
  let refs = 0;
  const api = async (method, path, body) => {
    calls.push({ method, path, body });
    if (method === "POST") {
      assert.equal(path, "/pulls");
      assert.equal(body.draft, true);
      assert.equal(body.base, "main");
      assert.equal(body.head, "development");
      if (options.createError) throw options.createError;
      return pr;
    }
    if (path.startsWith("/pulls?")) return options.lists?.[listings++] ?? [];
    if (path.includes("/heads/main")) return { object: { sha: main } };
    if (path.includes("/heads/development"))
      return {
        object: {
          sha: options.move && ++refs % 2 === 0 ? "c".repeat(40) : development,
        },
      };
    if (path.startsWith("/compare/")) return options.comparison ?? comparison;
    assert.fail(`Unexpected API operation: ${method} ${path}`);
  };
  return { api, calls };
}

test("first change creates one draft with explicit branches", async () => {
  const { api, calls } = fixture();
  assert.deepEqual(await ensureReleasePR({ api, paused: false }), {
    outcome: "created",
    url: `https://github.com/${repository}/pull/7`,
  });
  assert.equal(calls.filter((call) => call.method === "POST").length, 1);
  assert.equal(
    calls.filter((call) => call.path.startsWith("/pulls?")).length,
    2,
  );
});

test("later saves preserve an existing PR including human readiness and discussion", async () => {
  for (const current of [comparison, { ...comparison, files: [] }]) {
    const { api, calls } = fixture({
      lists: [
        [
          {
            ...pr,
            draft: false,
            title: "Human title",
            body: "Human discussion",
          },
        ],
      ],
      comparison: current,
    });
    const result = await ensureReleasePR({ api, paused: false });
    assert.equal(result.outcome, "reused");
    assert.equal(result.changes, current.files.length ? "ready" : "no_changes");
    assert.equal(
      calls.some((call) => call.method !== "GET"),
      false,
    );
  }
});

test("duplicates require attention without comparison or writes", async () => {
  const { api, calls } = fixture({ lists: [[pr, { ...pr, number: 8 }]] });
  assert.equal(
    (await ensureReleasePR({ api, paused: false })).outcome,
    "needs_attention",
  );
  assert.equal(calls.length, 1);
});

test("ambiguous history remains a visible failure when a release PR already exists", async () => {
  const { api, calls } = fixture({
    lists: [[pr]],
    comparison: {
      ...comparison,
      status: "diverged",
      behind_by: 1,
      merge_base_commit: { sha: "c".repeat(40) },
    },
  });
  const result = await ensureReleasePR({ api, paused: false });
  assert.equal(result.outcome, "needs_attention");
  assert.equal(result.url, `https://github.com/${repository}/pull/7`);
  assert.match(result.reason, /existing PR is preserved/);
  assert.equal(
    calls.some((call) => call.method !== "GET"),
    false,
  );
});

test("foreign repositories, wrong bases and closed PRs are ignored; pagination is followed", async () => {
  const foreign = {
    ...pr,
    head: { ...pr.head, repo: { full_name: "someone/astro_website" } },
  };
  const wrongBase = { ...pr, base: { ...pr.base, ref: "other" } };
  const { api, calls } = fixture({
    lists: [
      [
        ...Array.from({ length: 98 }, () => foreign),
        wrongBase,
        { ...pr, state: "closed" },
      ],
      [pr],
    ],
  });
  assert.equal(
    (await ensureReleasePR({ api, paused: false })).outcome,
    "reused",
  );
  assert.ok(calls.some((call) => call.path.endsWith("page=2")));
});

test("post-release behind history never opens a reverse PR; diverged history needs reconciliation", async () => {
  for (const [status, ahead, behind, mergeBase, outcome] of [
    ["behind", 0, 1, development, "no_changes"],
    ["diverged", 1, 1, "c".repeat(40), "needs_attention"],
  ]) {
    const { api, calls } = fixture({
      comparison: {
        ...comparison,
        status,
        ahead_by: ahead,
        behind_by: behind,
        merge_base_commit: { sha: mergeBase },
      },
    });
    assert.equal(
      (await ensureReleasePR({ api, paused: false })).outcome,
      outcome,
    );
    assert.equal(
      calls.some((call) => call.method !== "GET"),
      false,
    );
  }
  assert.equal(
    classifyComparison(
      { ...comparison, status: "identical", ahead_by: 0, files: [] },
      { main, development: main },
    ),
    "no_changes",
  );
  assert.throws(() =>
    classifyComparison(
      { ...comparison, files: undefined },
      { main, development },
    ),
  );
  assert.throws(() =>
    classifyComparison(
      { ...comparison, base_commit: { sha: "c".repeat(40) } },
      { main, development },
    ),
  );
});

test("a human creating between checks is reused", async () => {
  const { api, calls } = fixture({ lists: [[], [pr]] });
  assert.equal(
    (await ensureReleasePR({ api, paused: false })).outcome,
    "reused",
  );
  assert.equal(
    calls.some((call) => call.method !== "GET"),
    false,
  );
});

test("a creation race or uncertain network result requeries exactly without another POST", async () => {
  for (const status of [422, 0]) {
    const { api, calls } = fixture({
      lists: [[], [], [pr]],
      createError: new GitHubError(status),
    });
    assert.equal(
      (await ensureReleasePR({ api, paused: false })).outcome,
      "reused",
    );
    assert.equal(calls.filter((call) => call.method === "POST").length, 1);
  }
});

test("permission, rejected draft and API failures remain failures", async () => {
  for (const status of [401, 403, 422, 500, 0]) {
    const { api, calls } = fixture({ createError: new GitHubError(status) });
    await assert.rejects(ensureReleasePR({ api, paused: false }), { status });
    assert.equal(calls.filter((call) => call.method === "POST").length, 1);
  }
});

test("moving revisions cause bounded retries without a stale creation", async () => {
  const { api, calls } = fixture({ move: true });
  assert.equal(
    (await ensureReleasePR({ api, paused: false })).outcome,
    "needs_attention",
  );
  assert.equal(
    calls.some((call) => call.method !== "GET"),
    false,
  );
});

test("pause makes no requests; closure is replaced only on the next unpaused invocation", async () => {
  const { api, calls } = fixture();
  assert.deepEqual(await ensureReleasePR({ api, paused: true }), {
    outcome: "paused",
  });
  assert.equal(calls.length, 0);
  await assert.rejects(ensureReleasePR({ api }));
  assert.equal(
    (await ensureReleasePR({ api, paused: false })).outcome,
    "created",
  );
});

test("transport refuses branch writes, approval, merge, comments and auto-merge", async () => {
  const api = githubAPI("test-token", async () =>
    assert.fail("Forbidden operation reached GitHub"),
  );
  for (const [method, path, body] of [
    ["PATCH", "/git/refs/heads/development", { force: true }],
    ["POST", "/git/commits", {}],
    ["POST", "/pulls/7/reviews", { event: "APPROVE" }],
    ["PUT", "/pulls/7/merge", {}],
    ["DELETE", "/git/refs/heads/development"],
    ["POST", "/graphql", { query: "enablePullRequestAutoMerge" }],
    ["PATCH", "/pulls/7", { body: "erase discussion" }],
    ["POST", "/pulls", { head: "other", base: "main", draft: true }],
  ])
    await assert.rejects(
      api(method, path, body),
      /outside the release-PR contract/,
    );
});

test("transport rejects redirects and keeps upstream bodies/tokens out of diagnostics", async () => {
  const token = "secret-test-value";
  const api = githubAPI(token, async (_url, options) => {
    assert.equal(options.redirect, "error");
    return new Response(token, { status: 403 });
  });
  await assert.rejects(
    api("GET", "/git/ref/heads/main"),
    (error) => error.status === 403 && !error.message.includes(token),
  );
});
