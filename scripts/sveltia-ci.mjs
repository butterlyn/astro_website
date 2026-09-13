// Trial-only CI glue: build content with trusted Astro code and report a native
// GitHub commit status so Sveltia can discover Cloudflare's version preview URL.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  appendFileSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";
import { waitForPreviewCommit } from "./preview-ready.ts";

const repository = "butterlyn/astro_website";
const branch = "trial/sveltia";
const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
const pr =
  process.env.GITHUB_EVENT_NAME === "pull_request"
    ? event.pull_request
    : undefined;
assert.equal(process.env.GITHUB_REPOSITORY, repository);
if (pr) {
  assert.equal(pr.base.ref, branch);
  assert.equal(pr.head.repo.full_name, repository);
  assert.match(pr.head.ref, /^cms\/sveltia_(homepage|pages)\/[a-z0-9-]+$/);
} else {
  assert.equal(process.env.GITHUB_EVENT_NAME, "push");
  assert.equal(process.env.GITHUB_REF, `refs/heads/${branch}`);
}
const sha = pr?.head.sha ?? process.env.GITHUB_SHA;
assert.match(sha, /^[a-f0-9]{40}$/);
const git = (...args) =>
  execFileSync("git", args, { maxBuffer: 30 * 1024 * 1024 });
const output = (key, value) =>
  appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);

async function api(path, body) {
  const response = await fetch(
    `https://api.github.com/repos/${repository}/${path}`,
    {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${process.env.GH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      redirect: "error",
      signal: AbortSignal.timeout(30_000),
    },
  );
  if (!response.ok) throw new Error(`GitHub ${path}: HTTP ${response.status}`);
  return response.json();
}

switch (process.argv[2]) {
  case "prepare": {
    if (pr) {
      // Only read regular Markdown/image blobs from the PR. Never check out its
      // workflows, package scripts, dependencies, Astro components or config.
      const base = git("merge-base", pr.base.sha, sha).toString().trim();
      const paths = git("diff", "--name-only", "--no-renames", "-z", base, sha)
        .toString()
        .split("\0")
        .filter(Boolean);
      const allowed =
        /^(src\/content\/homepage\/home\.md|src\/content\/pages\/[a-z0-9]+(?:-[a-z0-9]+)*\.md|public\/images\/[a-zA-Z0-9][a-zA-Z0-9._ -]*\.(?:avif|gif|jpe?g|png|svg|webp))$/;
      for (const path of paths) {
        assert.match(
          path,
          allowed,
          "Draft previews accept Markdown and image changes only.",
        );
        const tree = git("ls-tree", sha, "--", path).toString();
        if (!tree) {
          rmSync(path, { force: true });
          continue;
        }
        assert.match(
          tree,
          /^100644 blob /,
          "Draft files must be ordinary files, not links or executable code.",
        );
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, git("show", `${sha}:${path}`));
      }
    }
    output("sha", sha);
    break;
  }
  case "guard": {
    const config = JSON.parse(readFileSync("wrangler.sveltia.jsonc", "utf8"));
    assert.equal(config.name, "leer-sveltia");
    assert.equal(config.workers_dev, true);
    assert.equal(config.preview_urls, true);
    assert.deepEqual(config.assets, {
      directory: "./dist",
      html_handling: "auto-trailing-slash",
      not_found_handling: "404-page",
    });
    for (const key of ["main", "route", "routes", "env", "build"])
      assert.ok(!(key in config));
    const authConfig = JSON.parse(
      readFileSync("trial/sveltia-auth/wrangler.jsonc", "utf8"),
    );
    assert.equal(authConfig.name, "leer-sveltia-auth");
    assert.equal(authConfig.main, "vendor/index.js");
    assert.equal(authConfig.workers_dev, true);
    assert.equal(authConfig.preview_urls, false);
    for (const key of ["route", "routes", "env", "build"])
      assert.ok(!(key in authConfig));
    assert.equal(
      JSON.parse(readFileSync("dist/build.json", "utf8")).commit,
      sha,
    );
    const live = pr
      ? await api(`pulls/${pr.number}`)
      : await api(`git/ref/heads/${branch}`);
    const current = pr
      ? live.state === "open" &&
        live.head.sha === sha &&
        live.base.ref === branch &&
        live.head.repo.full_name === repository
      : live.object.sha === sha;
    output("current", current);
    console.log(
      current
        ? "Current trial snapshot verified."
        : "Skipping a superseded trial snapshot.",
    );
    break;
  }
  case "status": {
    const state = process.argv[3];
    assert.ok(["pending", "success", "failure", "error"].includes(state));
    const url =
      state === "success"
        ? process.env.SVELTIA_PREVIEW_URL
        : `https://github.com/${repository}/actions/runs/${process.env.GITHUB_RUN_ID}`;
    if (state === "success") {
      assert.match(
        url,
        /^https:\/\/(?:pr-[0-9]+-)?leer-sveltia\.butterlyn\.workers\.dev$/,
      );
      await waitForPreviewCommit(
        (path) =>
          fetch(new URL(path, url), {
            cache: "no-store",
            redirect: "error",
            signal: AbortSignal.timeout(15_000),
          }),
        sha,
      );
    }
    await api(`statuses/${sha}`, {
      state,
      context: "sveltia/preview",
      target_url: url,
      description:
        state === "success"
          ? "Astro trial preview is available"
          : `Astro trial preview: ${state}`,
    });
    break;
  }
  default:
    throw new Error("Use prepare, guard, or status.");
}
