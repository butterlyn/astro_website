# SETUP: agentic development environment

Checklist for reproducing the tooling this repository expects. Everything that
can be project-scoped is committed (skills, MCP server config, editor
recommendations). The "per machine" items are the only manual steps.

Legend: `[x]` done on the originating machine on 2026-09-11, `[ ]` pending.
Version numbers are what was current at setup; re-check before pinning in
`package.json` (see `specs/spec.md`, section 3).

## 1. Per machine (one time)

### Runtime and CLIs

- [x] WSL2 with Ubuntu 24.04 (any Linux works; commands assume apt and bash).
- [x] Node.js 24 LTS through nvm: `nvm install 24 && nvm alias default 24`.
      Astro needs Node 22.12 or newer; odd-numbered Node releases are not LTS.
- [ ] After restarting Claude Code: `nvm uninstall 25.2.1` (the session that
      wrote this file was still running from it).
- [x] pnpm 12, installed into that Node: `npm install -g pnpm@12.4.1`.
      `packageManager` in `package.json` will pin the exact version and pnpm
      switches itself to it; Corepack is not used. Check `which -a pnpm`
      resolves to the nvm path first, not a Windows shim under `/mnt/c`.
      Quirk on the originating machine: a stray `package.json` in the parent
      `Coding` folder pins `pnpm@10.24.0`, so `pnpm -v` reports 10.x until
      this repo has its own `package.json` (the nearest pin wins).
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
      `gh auth token`, so this adds no new exposure.
- [x] Codex only loads a project's `.codex/` layer when the project is
      trusted. Add to `~/.codex/config.toml` (adjust the path):

      ```toml
      [projects."/mnt/c/Users/Butte/Documents/Coding/astro_website"]
      trust_level = "trusted"
      ```

- [x] Cloudflare skills come from the repo (see section 2). If they are ever
      missing: `npx skills experimental_install` restores `skills-lock.json`.
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
| `skills-lock.json` | Pinned skill sources and hashes. |
| `.vscode/extensions.json` | Recommended editor extensions. |
| `.gitignore` | Astro, pnpm, Wrangler and Playwright outputs, env files, agent-local settings. |

Add a skill: `npx skills add <owner/repo>` (installs to `.agents/skills` and
links `.claude/skills`). Remove one: `npx skills remove <name>`.

## 3. Accounts and secrets

- [x] GitHub repository `butterlyn/astro_website`, private, default branch
      `main`. Move it to the company organisation once that is decided
      (`specs/intent.md`, Q-05).
- [ ] Cloudflare account (the free plan covers Workers Static Assets).
- [ ] Cloudflare API token from the "Edit Cloudflare Workers" template, plus
      the Account ID, stored as GitHub Actions secrets. Values are typed at
      the prompt and never committed:

      ```bash
      gh secret set CLOUDFLARE_API_TOKEN
      gh secret set CLOUDFLARE_ACCOUNT_ID
      ```

- [ ] Do not connect the Cloudflare dashboard's Workers Builds git integration.
      GitHub Actions is the only deployer (`specs/spec.md`, D-11).
- [ ] Branch ruleset on `main` requiring the CI checks, once
      `.github/workflows/` exists (spec R-08).
- [ ] Production domain (spec R-05, launch prerequisite).

No `wrangler login` is needed locally: `wrangler dev` serves static assets
offline and deployments run in CI.

## 4. Known consequences of keeping the repo on `/mnt/c`

The repo lives on the Windows drive, mounted in WSL over 9p. This was a
deliberate choice; expect the following.

- pnpm installs are slower than on the Linux filesystem, and pnpm copies
  packages instead of hard-linking them from its store, because the store
  (Linux home) and the project (Windows drive) are on different filesystems.
  Optional fix, since hard links do work on `/mnt/c`: put the store on the
  same drive with `pnpm config set store-dir /mnt/c/Users/<you>/.pnpm-store --global`.
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
```

## 6. Next steps

1. Review and approve `specs/spec.md`.
2. Write `plan.md` with the implementation tasks (spec section 9).
3. Scaffold the project with `pnpm create astro`, pin versions, add the CI
   workflow and `wrangler.jsonc`, then add the Cloudflare secrets above.
