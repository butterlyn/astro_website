import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const repository = "butterlyn/astro_website";
const shaPattern = /^[a-f0-9]{40}$/;

export class GitHubError extends Error {
  constructor(status) {
    super(
      `GitHub request failed (HTTP ${status}). Check Actions PR permissions and retry.`,
    );
    this.status = status;
  }
}

// This transport deliberately permits only reads and creating the release PR.
// There is no generic write API, dependency installation or Git operation.
export function githubAPI(token, fetchImpl = fetch) {
  if (!token) throw new Error("A GitHub Actions token is required.");
  return async (method, path, body) => {
    const read =
      method === "GET" &&
      (/^\/git\/ref\/heads\/(main|development)$/.test(path) ||
        /^\/compare\/[a-f0-9]{40}\.\.\.[a-f0-9]{40}\?per_page=1$/.test(path) ||
        /^\/pulls\?state=open&base=main&head=butterlyn%3Adevelopment&per_page=100&page=[1-9]\d*$/.test(
          path,
        ));
    const create =
      method === "POST" &&
      path === "/pulls" &&
      body?.base === "main" &&
      body?.head === "development" &&
      body?.draft === true;
    if (!read && !create)
      throw new Error("Operation outside the release-PR contract.");
    let response;
    try {
      response = await fetchImpl(
        `https://api.github.com/repos/${repository}${path}`,
        {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2026-03-10",
            ...(body ? { "Content-Type": "application/json" } : {}),
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
          redirect: "error",
          signal: AbortSignal.timeout(15_000),
        },
      );
    } catch {
      throw new GitHubError(0);
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new GitHubError(response.status);
    }
    return response.json();
  };
}

async function openPRs(api) {
  const matching = [];
  for (let page = 1; page <= 100; page++) {
    const prs = await api(
      "GET",
      `/pulls?state=open&base=main&head=butterlyn%3Adevelopment&per_page=100&page=${page}`,
    );
    if (!Array.isArray(prs)) throw new Error("Malformed GitHub PR list.");
    for (const pr of prs) {
      if (
        pr.state === "open" &&
        pr.head?.ref === "development" &&
        pr.base?.ref === "main" &&
        pr.head.repo?.full_name === repository &&
        pr.base.repo?.full_name === repository
      ) {
        if (!Number.isSafeInteger(pr.number) || pr.number < 1)
          throw new Error("Malformed PR number.");
        matching.push(pr);
      }
    }
    if (prs.length < 100) return matching;
  }
  throw new Error("PR pagination exceeded its limit; reconcile manually.");
}

async function heads(api) {
  const [main, development] = await Promise.all([
    api("GET", "/git/ref/heads/main"),
    api("GET", "/git/ref/heads/development"),
  ]);
  const result = {
    main: main.object?.sha,
    development: development.object?.sha,
  };
  if (
    !shaPattern.test(result.main ?? "") ||
    !shaPattern.test(result.development ?? "")
  ) {
    throw new Error("Both release branches must exist with full commit SHAs.");
  }
  return result;
}

export function classifyComparison(comparison, snapshot) {
  const {
    status,
    ahead_by: ahead,
    behind_by: behind,
    files,
    merge_base_commit: mergeBase,
    base_commit: base,
  } = comparison;
  if (
    !Number.isInteger(ahead) ||
    ahead < 0 ||
    !Number.isInteger(behind) ||
    behind < 0 ||
    !Array.isArray(files) ||
    base?.sha !== snapshot.main ||
    !shaPattern.test(mergeBase?.sha ?? "")
  ) {
    throw new Error(
      "Incomplete GitHub comparison; refusing to infer a release diff.",
    );
  }
  if (
    status === "identical" &&
    ahead === 0 &&
    behind === 0 &&
    snapshot.main === snapshot.development
  )
    return "no_changes";
  if (
    status === "behind" &&
    ahead === 0 &&
    behind > 0 &&
    mergeBase.sha === snapshot.development
  )
    return "no_changes";
  if (
    status === "ahead" &&
    ahead > 0 &&
    behind === 0 &&
    mergeBase.sha === snapshot.main
  ) {
    return files.length ? "ready" : "no_changes";
  }
  return "needs_attention";
}

async function diff(api, snapshot) {
  // GitHub compares the merge base to the head; files appear on page one.
  // One commit per page avoids downloading an entire branch history.
  return classifyComparison(
    await api(
      "GET",
      `/compare/${snapshot.main}...${snapshot.development}?per_page=1`,
    ),
    snapshot,
  );
}

function existing(prs, change) {
  if (prs.length > 1)
    return {
      outcome: "needs_attention",
      reason: "Multiple matching release PRs; resolve manually.",
    };
  if (prs.length === 1)
    return {
      outcome: change === "needs_attention" ? "needs_attention" : "reused",
      url: `https://github.com/${repository}/pull/${prs[0].number}`,
      changes: change,
      ...(change === "needs_attention"
        ? {
            reason:
              "Release history needs reconciliation; the existing PR is preserved.",
          }
        : {}),
    };
}

export async function ensureReleasePR({ api, paused }) {
  if (typeof paused !== "boolean")
    throw new Error("Set the release automation pause state explicitly.");
  if (paused) return { outcome: "paused" };
  for (let attempt = 0; attempt < 3; attempt++) {
    const prs = await openPRs(api);
    if (prs.length > 1) return existing(prs);
    const snapshot = await heads(api);
    const change = await diff(api, snapshot);
    const found = existing(prs, change);
    if (found) return found;
    if (change !== "ready") return { outcome: change };

    const recheckedPRs = await openPRs(api);
    const rechecked = existing(recheckedPRs, change);
    if (rechecked) return rechecked;
    const current = await heads(api);
    if (
      current.main !== snapshot.main ||
      current.development !== snapshot.development
    )
      continue;

    try {
      const created = await api("POST", "/pulls", {
        title: "Next website release",
        head: "development",
        base: "main",
        draft: true,
        body: "Saving adds changes to this PR; publication requires human review and merge.\n\nReview the saved preview at https://edit.leer.education and verify its revision against this PR.\n\nThis milestone uses explicitly labelled placeholder content with noindex. Only the originator may approve publication. Hosted editing and release acceptance must pass before this draft is ready.",
      });
      if (!Number.isSafeInteger(created.number) || created.number < 1)
        throw new Error("Malformed created PR response.");
      return {
        outcome: "created",
        url: `https://github.com/${repository}/pull/${created.number}`,
      };
    } catch (error) {
      // A 422 can mean someone else created the PR; a network timeout can
      // conceal a successful creation. Permission/server errors stay visible.
      if (!(error instanceof GitHubError) || ![0, 422].includes(error.status))
        throw error;
      const raced = existing(await openPRs(api), change);
      if (raced) return raced;
      if (
        error.status === 422 &&
        (await diff(api, await heads(api))) === "no_changes"
      )
        return { outcome: "no_changes" };
      throw error;
    }
  }
  return {
    outcome: "needs_attention",
    reason:
      "Branches kept moving during reconciliation; retry after editing settles.",
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (
    process.env.GITHUB_REPOSITORY !== repository ||
    process.env.GITHUB_REF !== "refs/heads/development" ||
    !["push", "workflow_dispatch"].includes(process.env.GITHUB_EVENT_NAME)
  ) {
    throw new Error(
      "Run only on the trusted development push or development dispatch.",
    );
  }
  const state = process.env.RELEASE_PR_AUTOMATION ?? "";
  if (!["", "enabled", "paused"].includes(state))
    throw new Error("RELEASE_PR_AUTOMATION must be enabled or paused.");
  const result = await ensureReleasePR({
    api: githubAPI(process.env.GH_TOKEN),
    paused: state !== "enabled",
  });
  console.log(JSON.stringify(result));
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `outcome=${result.outcome}\nurl=${result.url ?? ""}\n`,
    );
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `Release PR: ${result.outcome}${result.url ? ` — ${result.url}` : ""}. ${result.reason ?? ""}\n`,
    );
  if (result.outcome === "needs_attention") process.exitCode = 1;
}
