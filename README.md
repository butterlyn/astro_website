# Throwaway website preview

This branch proves the Astro → GitHub Actions → Cloudflare Workers Static Assets
pipeline using labeled placeholder content. Read [SETUP.md](SETUP.md) for the
machine setup, existing secrets and enforced GitHub Free protection.

Only `dummy/pipeline-proof-20260912` deploys, to the non-production Worker
`leer-preview` at <https://leer-preview.butterlyn.workers.dev/>.
The original Worker, `astro-website-dummy-20260912`, remains available at its old
address until cleanup; future updates deploy only to `leer-preview`.
The homepage and custom 404 share a static layout
and require no browser JavaScript. Copy lives in `src/data/site.ts`. Every page
has `noindex` metadata and an `X-Robots-Tag` header; robots.txt disallows crawling.
This public preview contains no confidential content.

## Local workflow

```bash
nvm use
pnpm install --frozen-lockfile
pnpm exec playwright install --with-deps chromium firefox webkit
pnpm check:setup
pnpm format:check
pnpm lint
pnpm check
pnpm check:pipeline
pnpm build
pnpm test:e2e
```

| Command                             | Behavior                                                                                                 |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile`    | Install the committed resolution; reject manifest drift and unreviewed install scripts.                  |
| `pnpm dev`                          | Start Astro development.                                                                                 |
| `pnpm check`                        | Strict Astro and TypeScript checks, including tests, scripts and configuration.                          |
| `pnpm lint`                         | Biome lint for standalone JavaScript/TypeScript; its formatter is disabled.                              |
| `pnpm format:check`                 | Prettier checks, including Astro; vendored skills and supplied specifications are excluded.              |
| `pnpm format`                       | Apply Prettier formatting.                                                                               |
| `pnpm build`                        | Build `dist/` and stamp `build.json` with the source commit.                                             |
| `pnpm preview:cloudflare`           | Serve the existing build locally at `http://127.0.0.1:8787` with Wrangler; no login required.            |
| `pnpm test:e2e`                     | Start local Wrangler; test the build in Chromium, Firefox and WebKit; record a mobile Lighthouse report. |
| `pnpm check:setup`                  | Verify skill hashes/symlinks and the existing Cloudflare preflight failure-path tests.                   |
| `pnpm check:pipeline`               | Test branch, marker, stale-commit and Worker-target safeguards.                                          |
| `pnpm preflight:cloudflare`         | Read-only account and workers.dev checks using GitHub-held credentials before deployment.                |
| `pnpm smoke:preview <url> <commit>` | Check the public homepage, assets, noindex, real HTTP 404 and deployed commit.                           |

Node **24.21.0**, pnpm **12.4.1**, TypeScript **6.0.3**, and `@astrojs/check`
**0.9.10** retain the setup pins. All new direct dependencies have exact versions
and were resolved with strict peer checking. Tailwind uses its first-party Vite
plugin. Prettier owns formatting; Biome excludes Astro files.

Install scripts were initially blocked and reviewed. Only esbuild
**0.28.1/0.28.2** and workerd **1.20260911.1** may run their native-binary
installers. They select and verify a packaged platform binary, with npm-registry
fallbacks if optional packages are missing. New script versions fail installation
until reviewed. The exact release-age exceptions in `pnpm-workspace.yaml` cover
the reviewed Wrangler **4.131.1** release and its runtime dependencies; future
exceptions require review. That stable Wrangler release itself pins Miniflare
**5.20260911.0-alpha** for local simulation. The compatibility date is deliberately
**2026-09-11**, the current UTC date (already September 12 in Perth); Wrangler
rejects a future UTC date. There is no custom Worker script, Astro adapter or Node server.

## Actions and artifact safety

`.github/workflows/dummy-preview.yml` runs validation on every pull request,
including documentation-only changes. Ordinary pushes to the named preview branch
run setup checks, formatting, lint, strict checking, safeguard tests, a static
build, a Wrangler dry run, browser checks and Lighthouse diagnostics.

Browser tests cover widths 320, 390, 768 and 1440, keyboard navigation, doubled
text size, no-JavaScript behavior, internal links, noindex and real HTTP 404s. Axe
runs on both page types. Reports, screenshots and failure traces are retained as
Actions artifacts for seven days; local evidence is in `reports/`, `test-results/`
and `playwright-report/`. Lighthouse is diagnostic, with no invented score budget.

Deployment depends on successful validation. Validation uploads an archive of the
tested `dist/` and publishes its SHA-256 as a job output. Deployment downloads
that run's artifact, verifies its digest and commit, and deploys without rebuilding.
`dist/build.json`, the Actions summary and the live smoke check tie the output to
its validated commit.

Workflow permissions are read-only and Actions are pinned to reviewed release
commit SHAs. Cloudflare secrets are present only in trusted preflight, deploy and
deletion/verification steps. Installs and browser tests receive no Cloudflare
secrets. Preflight failure stops deployment and reports the concrete account-side
fix. GitHub Actions is the sole deployer; keep Workers Builds disconnected.

Deployment and cleanup share one workflow concurrency queue with cancellation
disabled. Before Cloudflare access, a guard queries the current GitHub branch head
and rejects stale commits, unexpected Worker configuration and the wrong marker
state. A queued or rerun older deployment cannot recreate the Worker after
cleanup. The original concurrency key is retained so historical workflow runs
remain in the same queue. If the branch changes during an active deploy, cleanup
waits for that workflow and then deletes both preview Workers.

The intentional first push includes a TypeScript error to prove validation failure
skips deployment. The next push fixes it and runs the full pipeline. Inspect with
`gh run list --branch dummy/pipeline-proof-20260912` and
`gh run watch <run-id> --exit-status`.

The [deliberate-failure run](https://github.com/butterlyn/astro_website/actions/runs/34636133367)
failed at `pnpm check` and skipped the entire deployment job. Its frozen install,
setup checks, formatting and lint passed. The temporary failing source file was
then removed; the required checks remain intact. Local validation passed all 25
browser/report checks after fixing enlarged-text overflow. The mobile report
recorded performance/accessibility/best-practices scores of 100, LCP 0.8 seconds
and CLS 0; SEO is intentionally limited by preview indexing restrictions.

`main`, public visibility and its enforced `Setup validation` protection are
preserved. This disposable workflow never ships to `main`; add permanent site
checks to branch protection when the production workflow is approved and available
on every PR. No paid plan or production environment is required here.

## Cleanup when requested

Do not merge this throwaway branch. When the originator says **clean up**, add a
dedicated marker commit:

```bash
git switch dummy/pipeline-proof-20260912
printf 'Delete both throwaway preview Workers.\n' > .cleanup-preview
git add .cleanup-preview
git commit -m "Clean up the throwaway preview Workers"
git push
gh run list --branch dummy/pipeline-proof-20260912
gh run watch <cleanup-run-id> --exit-status
```

That push runs only the operation selector and deletion job. Validation, build and
deployment are skipped. Deletion uses pinned Wrangler and confirms Cloudflare
returns HTTP 404 for both `leer-preview` and `astro-website-dummy-20260912`.
An already absent Worker is skipped, so a partially completed cleanup can be
retried. After success, check both former public URLs and delete the branch:

```bash
git push origin --delete dummy/pipeline-proof-20260912
git switch main
git branch -D dummy/pipeline-proof-20260912
```

Keep the branch if deletion fails, correct the account/token problem, and rerun
cleanup. Never remove the marker to retry. Cleanup uses a push trigger because
`workflow_dispatch` is unavailable until a workflow exists on the default branch.

## Review boundaries

This demonstrates the pipeline; it does not approve a production launch. Real
mobile Safari/Chrome checks, screen-reader review, company content/branding,
production domain/indexing and a production recovery rehearsal remain launch work.
Automated keyboard, text-size, axe and browser checks do not claim complete
accessibility conformance. No optional integrations have been added.

References: [Cloudflare static routing](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/),
[GitHub concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency),
[pnpm build permissions](https://pnpm.io/settings/build#allowbuilds), and
[Astro styling](https://docs.astro.build/en/guides/styling/).
