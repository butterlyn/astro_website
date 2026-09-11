# SETUP: agentic development environment

Checklist for reproducing the tooling this repository expects. Everything that
can be project-scoped is committed (skills, MCP server config, editor
recommendations). The "per machine" items are the only manual steps.

Legend: `[x]` completed, `[ ]` pending. Machine state was independently checked
on 2026-09-12. Node, pnpm, TypeScript and the Astro checker are now pinned in
`.nvmrc`, `package.json` and `pnpm-lock.yaml`; preserve these pins when scaffolding
the site and review compatibility before upgrading them.

## 1. Per machine (one time)

### Runtime and CLIs

- [x] WSL2 with Ubuntu 24.04 (any Linux works; commands assume apt and bash).
- [x] Node.js 24 LTS through nvm: `nvm install 24 && nvm alias default 24`.
      Astro needs Node 22.12 or newer; odd-numbered Node releases are not LTS.
- [x] Node 25.2.1 has been removed. The active nvm installation is 24.21.0.
      Run `nvm use` in this repository. After shell configuration changes,
      open a fresh terminal and check `node -v` before launching an agent.
- [x] pnpm 12, installed into that Node: `npm install -g pnpm@12.4.1`.
      `packageManager` in `package.json` will pin the exact version and pnpm
      switches itself to it; Corepack is not used. Check `which -a pnpm`
      resolves to the nvm path first, not a Windows shim under `/mnt/c`.
      The old parent `Coding/package.json` pin has been removed; this repo's
      `packageManager` field now selects pnpm 12.4.1.
- [x] TypeScript 6.0.3 and `@astrojs/check` 0.9.10 are pinned together.
      The checker's published peer range is `^5.0.0 || ^6.0.0`, so TypeScript
      7.x is outside its supported range. `pnpm-workspace.yaml` enables strict peer
      checks and exact version saves. Add the remaining site dependencies
      during scaffolding and commit the resulting lockfile.
- [x] git identity set, `git config --global init.defaultBranch main`.
- [x] GitHub CLI logged in: `gh auth login` with scopes `repo` and `workflow`
      (`workflow` is required to push `.github/workflows/` files).
- [x] Open the Windows browser from WSL CLIs: `sudo apt install wslu xdg-utils`
      and `export BROWSER=wslview` in `~/.bashrc`.
- [x] Playwright browsers and system libraries:
      `npx -y playwright@1.63.0 install --with-deps` (uses sudo for apt).
      Re-run as `pnpm exec playwright install --with-deps` whenever the
      project's pinned Playwright version changes.

### Agents

- [x] Claude Code: `npm install -g @anthropic-ai/claude-code`, then `claude`
      and log in. On first start inside this repo, approve the project
      `.mcp.json` servers when prompted.
- [x] Codex CLI installed and logged in.
- [x] GitHub MCP authentication for both agents reuses the gh login. Add to
      `~/.bashrc`:

      ```bash
      export GITHUB_MCP_TOKEN="$(gh auth token 2>/dev/null)"
      ```

      `.mcp.json` and `.codex/config.toml` read this variable, so no token is
      stored in the repo. Any process in your shell could already run
      `gh auth token`, so this adds no new exposure. The variable must exist in
      the shell that launches the agent: after editing `~/.bashrc`, open a new
      terminal and confirm `echo ${#GITHUB_MCP_TOKEN}` prints a non-zero
      length. If it is empty, the GitHub server fails with "Authorization
      header is badly formatted".
- [x] Codex only loads a project's `.codex/` layer when the project is
      trusted. Add to `~/.codex/config.toml` (adjust the path):

      ```toml
      [projects."/mnt/c/Users/Butte/Documents/Coding/astro_website"]
      trust_level = "trusted"
      ```

- [x] Cloudflare skills come from the committed repo snapshot (see section 2).
      All five content hashes and Claude symlinks were verified. Restore missing
      skills from Git using the instructions below.
- [ ] Deliberately not set up: the Context7 connector, and `AGENTS.md` /
      `CLAUDE.md` (to be written with `plan.md`, per `specs/spec.md` section 9).

- [x] `.claude/settings.json` sets `disableClaudeAiConnectors: true`, so the
      account-level claude.ai connectors (GitHub, Google Drive, Gmail, Calendar,
      Context7, Mermaid) are not injected into sessions in this repo. Only the
      project-scoped servers in `.mcp.json` remain. The connectors stay
      available in other projects and in claude.ai itself; to remove one from
      the account entirely, use https://claude.ai/customize/connectors.

### Editor

- [x] VS Code with the Remote - WSL extension. Open the repo from WSL
      (`code .`) so the workspace extensions run on the Linux side.
- [x] Recommended extensions are listed in `.vscode/extensions.json`
      (Astro, Tailwind CSS, Biome, Prettier, Playwright); VS Code offers to
      install them on first open.

## 2. In the repository (committed)

| Path | Purpose |
| --- | --- |
| `specs/intent.md`, `specs/spec.md` | What to build and the proposed design. Agents read both before planning. |
| `.mcp.json` | Claude Code MCP servers: `github` (GitHub's remote MCP, bearer token from `GITHUB_MCP_TOKEN`) and `cloudflare-docs` (no auth). |
| `.codex/config.toml` | The same two MCP servers for Codex. |
| `.claude/settings.json` | Project settings for Claude Code; currently only disables account-level claude.ai connectors in this repo. |
| `.agents/skills/` | Cloudflare skills for Codex, installed with `npx skills add cloudflare/skills` and pruned to `cloudflare`, `wrangler`, `workers-best-practices`, `web-perf`, `turnstile-spin`. |
| `.claude/skills/` | Symlinks into `.agents/skills/` so Claude Code sees the same skills. |
| `skills-lock.json` | Skill source metadata and content hashes; exact installed files are versioned in Git. Upstream revisions are not pinned here. |
| `.nvmrc`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` | Pinned setup dependencies and strict peer checks; the site scaffold extends these files. |
| `scripts/verify-skills.mjs` | Verifies installed skill content hashes and Claude symlinks. |
| `scripts/cloudflare-preflight.mjs` | Checks account access and the workers.dev subdomain using read-only API calls. |
| `.github/workflows/setup-checks.yml` | Validates setup; the setup branch also checks GitHub-held Cloudflare credentials. |
| `.vscode/extensions.json` | Recommended editor extensions. |
| `.gitignore` | Astro, pnpm, Wrangler and Playwright outputs, env files, agent-local settings. |

Add a skill: `npx skills add <owner/repo>` (installs to `.agents/skills` and
links `.claude/skills`). Remove one: `npx skills remove <name>`.

To recover the exact committed skills, inspect local edits first, then restore
the snapshot and verify it:

```bash
git diff -- .agents/skills .claude/skills skills-lock.json
# Discards local edits to these paths; preserve any intentional edits first.
git restore --source=HEAD --worktree -- .agents/skills .claude/skills skills-lock.json
node scripts/verify-skills.mjs
```

Do not use `npx skills experimental_install` for exact recovery: the installed
skills CLI resolves these unpinned upstream sources again. Treat upstream
reinstallation as an update and review its file and hash changes. A fresh clone
already contains the exact skills and symlinks.

## 3. Accounts and secrets

- [x] GitHub repository `butterlyn/astro_website`, private, default branch
      `main`. Move it to the company organisation once that is decided
      (`specs/intent.md`, Q-05).
- [x] Cloudflare account (the free plan covers Workers Static Assets).
- [x] Cloudflare API token from the "Edit Cloudflare Workers" template, plus
      the Account ID, stored as GitHub Actions repository secrets
      `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` (set 2026-09-11).
      To rotate, run the same commands again; values are typed at the prompt
      and never committed:

      ```bash
      gh secret set CLOUDFLARE_API_TOKEN
      gh secret set CLOUDFLARE_ACCOUNT_ID
      ```

- [ ] Do not connect the Cloudflare dashboard's Workers Builds git integration.
      GitHub Actions is the only deployer (`specs/spec.md`, D-11).
- [x] No paid GitHub upgrade is required for the private-repository workflow.
      GitHub Free does not provide enforced branch protection/rulesets or
      deployment environments for private repositories. Use the CI safeguards
      below and keep this limitation explicit (spec R-08).
- [ ] Production domain (spec R-05, launch prerequisite).

No `wrangler login` is needed locally: `wrangler dev` serves static assets
offline and deployments run in CI.

### Cloudflare preflight

The setup workflow runs on pushes to `setup/review-fixes`; it performs a frozen
install and setup checks before the credential check. Pull-request checks never
receive Cloudflare secrets. The script checks that the token can list Workers
in the supplied account and that a workers.dev subdomain exists. It does not
print token values, account IDs, Worker names or the subdomain. Only GET requests
are issued, and credentials are not forwarded to redirects.

For a subsequent credential check, push a reviewed change to the setup branch.
The dummy workflow must also run `pnpm preflight:cloudflare` in its trusted
deployment job before deployment. Local execution is optional and requires the
two Cloudflare environment variables; GitHub secret values cannot be downloaded.

A passing preflight verifies read access. Deployment and deletion permissions
are established by the dummy deployment and its later cleanup. The dashboard
must separately confirm that the token's account permissions include editing
Workers Scripts and that Workers Builds is disconnected. If credentials fail,
correct the token/account pair with the `gh secret set` commands above. If the
subdomain is missing, create one under Workers & Pages in the Cloudflare dashboard.

### Private repository without a paid GitHub plan

Keep GitHub Actions as the deployer and implement these controls when adding the
site workflow:

- Run validation for pull requests and the deployment branch. The deploy job
  must depend on all validation jobs succeeding (`needs`), including browser
  checks of the built artifact. Failed or cancelled validation must skip deploy.
- Deploy only on pushes to the explicitly selected branch: the throwaway branch
  for the dummy, and `main` for a later approved production workflow. Pull requests
  never deploy or receive Cloudflare credentials.
- Deploy the tested artifact from the same commit, use read-only workflow
  permissions, and provide the Cloudflare secrets only to deployment/cleanup
  steps. Pin third-party actions to reviewed commit SHAs.
- Serialize deployment and cleanup for each Worker. The cleanup marker skips
  build/deploy and selects deletion only; a stale deployment must not recreate
  the Worker after cleanup.
- Review changes before merging and demonstrate that a deliberate validation
  failure skips deployment during the dummy run.

These controls prevent ordinary failed builds from deploying while the workflow
remains intact. They cannot stop a repository writer from pushing directly to
`main`, changing the workflow, or bypassing the checks. Running the dummy on
`main` does not change this limitation. GitHub-enforced branch protection is
available without a paid plan for **public** repositories, which exposes the
source and Git history; changing visibility requires a separate decision.

Sources: [protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches),
[deployment environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments),
[job dependencies](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idneeds).

## 4. Known consequences of keeping the repo on `/mnt/c`

The repo lives on the Windows drive, mounted in WSL over 9p. This was a
deliberate choice; expect the following.

- File operations can be slower than on the Linux filesystem. The verified
  pnpm 12 install used `/mnt/c/.pnpm-store/v11` and reported hard-linking packages
  into this project, so the old cross-filesystem copying workaround is no longer
  needed on this machine. Check the install output if the store location changes.
- Astro's dev server may miss file changes. If `pnpm dev` does not reload,
  set `vite.server.watch.usePolling: true` in `astro.config.mjs`.
- Files created from Windows carry spurious executable bits. This clone has
  `git config core.fileMode false`; set it again after a fresh clone.

## 5. Verify

```bash
node -v                 # v24.x
pnpm -v                 # 12.x
gh auth status          # logged in, scopes include repo and workflow
claude mcp list         # github and cloudflare-docs connected
codex mcp list          # github (Bearer token env var) and cloudflare-docs
npx -y skills ls        # the five Cloudflare skills
pnpm install --frozen-lockfile
pnpm check:setup        # skill integrity and preflight failure-path tests
```

## 6. Next steps

1. Review and approve `specs/spec.md`.
2. Write `plan.md` with the implementation tasks (spec section 9).
3. Extend the existing package manifest and lockfile with the Astro scaffold,
   required scripts, site CI workflow and `wrangler.jsonc`. Reuse the existing
   Cloudflare repository secrets.

For the throwaway pipeline proof, `prompts/dummy-site.md` explicitly permits
placeholder content and omitting `plan.md`. Keep it on its own branch and use
the pinned setup dependencies and safeguards above.
