# L.E.E.R. website

Astro website with a Markdown/Tina editing workflow being introduced through the agreed [migration plan](specs/plan.md). The first milestone uses labelled placeholder content and noindex. The public company launch is a separate milestone.

The repository bootstrap, separate build targets, representative Tina proof, cooperative editing reservation and release-PR helper are implemented. **Hosted editing and production release/recovery acceptance are not complete.** Current evidence and remaining gates are in [implementation status](docs/implementation-status.md).

## Development

Use Node from `.nvmrc` and the exact pnpm version in `package.json`.

```bash
pnpm install --frozen-lockfile
pnpm types:worker
pnpm tina:schema
pnpm dev
```

`pnpm dev` serves the saved placeholder on `http://127.0.0.1:4321`. Stop it before starting Tina on the same port:

```bash
pnpm dev:tina
```

Open `http://127.0.0.1:4321/edit/`, reserve editing and open the integration proof page. Startup builds the Worker and admin before serving them. Restart for component/schema changes or newly uploaded assets; text saves and contextual refreshes are live. Local Tina writes files in the current worktree; it does not commit or deploy them. The [Tina setup guide](docs/tina-setup.md) explains the later hosted connection.

## Validation and builds

| Command                             | Purpose                                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------------ |
| `pnpm check:setup`                  | Skill integrity and existing setup tests                                             |
| `pnpm types:worker`                 | Generate binding/runtime types from the editing config                               |
| `pnpm tina:schema`                  | Generate the local SDK and committed `tina/tina-lock.json`                           |
| `pnpm format:check` / `pnpm format` | Prettier checking/formatting                                                         |
| `pnpm lint`                         | Biome recommended rules; Prettier owns formatting                                    |
| `pnpm check` / `pnpm check:editing` | Astro and TypeScript checks                                                          |
| `pnpm check:pipeline`               | Release, artifact, refresh and reservation tests                                     |
| `pnpm test:feasibility`             | Executable Tina API limitations accepted by the originator                           |
| `pnpm build:production`             | Static snapshot in `dist/production`                                                 |
| `pnpm build:editing:local`          | Local Tina proof in `dist/editing`; not deployable                                   |
| `pnpm build:editing`                | Hosted editing artifact using ignored `.env`; requires Tina setup                    |
| `pnpm preview:cloudflare`           | Serve built production assets locally on port 8787                                   |
| `pnpm test:e2e`                     | Three browsers, four widths, accessibility, keyboard, no-JS, 404 and Lighthouse      |
| `pnpm test:editing`                 | Local workerd/SQLite reservation and editing-region tests                            |
| `node scripts/check-production.mjs` | Verify no editor routes/markers, source Markdown or unapproved uploads in production |

Before browser tests, install their engines with `pnpm exec playwright install chromium firefox webkit` (on CI, use `--with-deps`). Run builds/dev servers sequentially because they share generated Tina/Astro state. CI installs with the frozen lockfile and no deployment credentials.

The editing target uses a custom Worker entrypoint, verifies Access JWTs for hosted requests, disables unused Astro sessions, and uses image passthrough. The SQLite Durable Object is a cooperative site-wide reservation, not a Tina transaction gateway. The [editing runbook](docs/editing-and-review.md) explains handoff, uncertainty, backups and owner recovery.

## Source and release

`development` is the planned default/integration branch; `main` supplies approved public releases. The exact migration state is in the implementation record. Use temporary branches/worktrees for developer changes and preserve the long-lived branch with normal merges.

The [release runbook](docs/release-operations.md) describes the implemented draft-PR helper and the outstanding publication/recovery work. Missing `RELEASE_PR_AUTOMATION` configuration pauses PR creation during bootstrap. No credential-bearing deployment job is installed. The existing public site continues on its prior deployment until a deliberate approved release.

Production copies an explicit prototype asset allowlist, so generated Tina admin files cannot leak from `public/`. Build identity includes the source commit, target, content branch, backend mode, local dirty state and a digest of the delivered files. Production does not query TinaCloud. The editing runtime reads its token from a Worker secret rather than embedding it into an artifact.

Historical setup and disposable proof instructions remain in [SETUP.md](SETUP.md) and `prompts/`. Do not run historical cleanup commands against a Worker that may still serve the public domain.
