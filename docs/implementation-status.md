# Migration implementation record

Started 15 September 2026 (Perth). This record distinguishes implemented/local evidence from live acceptance. The complete [plan](../specs/plan.md) remains the delivery contract.

## Source baseline and account audit

- Worktree: `/home/butterlyn/worktrees/astro-website-development`, branch `development`, based on `origin/main` at `fc7672cdeb1d329b3a14a2b5e2530512544f3a0e`.
- Selected the site skeleton, test coverage and tooling from `9e7b2d1`; excluded the disposable deployment workflow, marker-based cleanup and dummy-only guards.
- Copied the staged intent/spec blobs without changing the original checkout/index. Reconciled public source/media policy, default-branch choice, prototype/noindex milestone, shared Tina identity and originator-only release authority in this worktree.
- GitHub is public. `butterlyn` is currently the only repository collaborator. `main` requires an up-to-date PR and `Setup validation`, including for admins, with stale-review dismissal and zero required additional reviews. Merge commits are enabled; auto-merge and automatic branch deletion are disabled.
- Actions default to read-only; the combined PR creation/approval setting is disabled. Existing secret names: `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`. There are no Tina variables/secrets yet.
- Local Wrangler is not authenticated; Cloudflare credentials exist only in GitHub. The new read-only topology-audit workflow uses those credentials without printing them or modifying resources.
- TinaCloud is not set up. The originator requested [setup guidance](tina-setup.md). Initial Access and editing-recovery identity: `admin@leer.education`; remaining reviewer addresses are pending.

## Implemented scope

| Plan area  | Repository implementation                                                                                                                                                                                      | Remaining exit evidence                                                                                                                |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 0    | Reconciled decisions; read-only GitHub audit; Cloudflare topology-audit helper; setup guide                                                                                                                    | Cloudflare routes/redirects/Access/build integrations; Tina account entitlement                                                        |
| Phase 1    | Isolated main-based baseline; frozen dependency pins; useful linting; permanent checks retaining `Setup validation`; no deployment triggers                                                                    | GitHub bootstrap rollout and check results recorded below                                                                              |
| Phase 2    | Separate outputs; Markdown page/shared fixtures; nested Tina bindings; three editable regions; bounded validated/no-store overlays; custom Worker with Access JWT verification; SQLite cooperative reservation | Hosted Tina login, Access entry points, real text/media writes, CPU/quota measurements, session/revocation and nontechnical acceptance |
| Phase 3    | Standard repo-media configured to `public/uploads`; production asset allowlist                                                                                                                                 | Actual upload/replace/delete commits, immutable filenames, release-relative media rendering and full referenced-asset filtering        |
| Phase 4    | Representative fixture only                                                                                                                                                                                    | Full placeholder content migration, routing, section contracts, editability inventory and page creation/deletion acceptance            |
| Phase 5    | Tested native draft ensure-PR helper; pause handling; artifact identity/digest; revision readiness utility                                                                                                     | Hosted preview, release provenance/deployment, live race tests, source resynchronization, owner recovery dispatch/rehearsal            |
| Phases 6–8 | Operating notes for subsequent work                                                                                                                                                                            | Impeccable/Agentation, reviewer handoff, full operational/manual acceptance, deliberate human test release, restore and retirement     |

Content expansion and production enablement remain behind the plan's hosted Phase 2 gate. Compilation and local workerd checks do not establish live account feasibility.

## Accepted cooperative reservation

Executable tests use unmodified exports from Tina **3.13.0**, bundling them for their browser package interop. They demonstrate that `beforeSubmit` rejects an ordinary save and retains text, but an already-admitted write can finish after timeout-based handoff; document deletion bypasses that hook; and a custom hosted content API disables default repo-media. Only upstream I/O is simulated in these counterexamples.

The originator then explicitly accepted a cooperative reservation with explicit handoff and manual recovery for stale/uncertain writes. This supersedes the original stronger-guard gate, without authorizing internal Tina patches or a custom backend.

The implementation atomically records ownership in a SQLite Durable Object. It never expires ownership into a new editor automatically. Ordinary saves compare the epoch captured when the admin loaded. Handoff requires an explicit reconciliation acknowledgement. Owner recovery/freeze invalidates earlier forms and requires an explicit resume. Review remains separate. Media/deletion and upstream in-flight writes retain the accepted limits; see [the editing runbook](editing-and-review.md).

## Selected toolchain

| Package/runtime                | Pin                                         |
| ------------------------------ | ------------------------------------------- |
| Node / pnpm / Astro / Wrangler | Existing 24.21.0 / 12.4.1 / 7.3.2 / 4.131.1 |
| Tina / CLI / Astro integration | 3.13.0 / 2.7.0 / 0.7.0                      |
| Astro Cloudflare adapter       | 14.3.1                                      |
| React / React DOM              | 18.3.1 / 18.3.1                             |
| esbuild / jose                 | 0.28.2 / 6.2.12                             |

Tina 3.14.0/CLI 3.0.0 were not adopted: their publication dates failed the existing minimum-release-age rule. The selected released versions satisfy the age and peer-dependency policies. Exact-version native install permissions add Tina's `better-sqlite3@12.11.1` and `esbuild@0.25.12`; `core-js@3.50.0`'s optional postinstall message is disabled. No age-policy relaxation was added for Tina.

The configs retain the existing workerd-compatible date **2026-09-11**. A proposed local-date value `2026-09-15` failed because it was still 14 September UTC; the runtime pin is retained for consistent local verification. Session KV is disabled; images use passthrough. The only planned persistent binding is the SQLite reservation. No resource has been provisioned by local tests.

Astro's public programmatic APIs keep the server attached to Tina and Playwright; the CLI auto-detaches in agent environments. The pinned adapter's development optimizer failed during Durable Object discovery with a missing `deps_ssr/base-*.js` chunk. Local editing therefore builds and previews the actual Worker alongside Tina's local API. Restart after component/schema changes or media uploads; content saves and unsaved region refreshes are live. This uses documented APIs without patching dependencies. Generated Worker types come from Wrangler and are excluded from Git along with generated SDK/admin files. `tina/tina-lock.json` is generated by `tinacms dev --no-server --noWatch`, not by `tinacms build`. [Astro programmatic API](https://docs.astro.build/en/reference/programmatic-reference/).

## Verification log

- Frozen install, skill integrity/setup checks, Prettier, Biome, production/editing Astro checks and TypeScript checks pass.
- 6 setup tests, 27 pipeline/state/input/artifact tests and 4 executable Tina feasibility counterexamples pass.
- 5 local workerd/browser tests pass. These cover the real SQLite reservation, all hosted-path unauthenticated rejections, simultaneous contenders, explicit handoff, stale sessions, three contextual regions, nested reorder overlays, actual visual title changes, isolation from saved review, Markdown save/reopen and unsaved-text retention after recovery. The save test restores the fixture afterward.
- The actual browser bridge adds `_tina_metadata` field paths; refresh validation now distinguishes those from content URLs while retaining size, nesting, object-key and unsafe-content checks.
- Both build targets pass. Production excludes editor routes/markers, raw Markdown and uploads; its Wrangler deployment dry run succeeds. All 25 public-site browser tests pass across Chromium, Firefox and WebKit, including four viewport widths, axe, keyboard, text resize, no-JavaScript and real 404 checks. Lighthouse mobile diagnostics are 100 performance/accessibility/best practices and 63 SEO, consistent with the required prototype noindex.
- A non-secret token canary exposed the adapter's generated `server/.dev.vars` copy. Packaging now removes generated environment files before hashing and rejects remaining token bytes anywhere in the artifact. The actual editing artifact passes this check; CI builds with the canary to keep this regression covered.
- Bootstrap source `9d2ca8d` is published on `development`, now GitHub's default branch. [Setup validation passed](https://github.com/butterlyn/astro_website/actions/runs/34876050675). Fresh-run findings added explicit creation of Wrangler's type-output directory and an explicit IPv4 loopback bind for Tina, matching the local Worker's API URL on GitHub's Linux runners. Final remote validation is pending.
- Release PR automation is enabled with read-only default Actions tokens. [The first dispatch created draft PR #3](https://github.com/butterlyn/astro_website/actions/runs/34876383370); [the second reused it](https://github.com/butterlyn/astro_website/actions/runs/34876517527). No PR approval, merge or publication occurred. See the runbook for GitHub's separate test-execution approval on bot-created PRs.
- The [read-only Cloudflare audit passed](https://github.com/butterlyn/astro_website/actions/runs/34876075239): `leer.education` is a custom domain of **`leer-preview`**, environment `production`; among the selected Worker names, only `leer-preview` exists. Its public mapping was preserved. Zone routes, redirects, Access and competing build integrations still need separate inspection.

No live release, remote media mutation, shared-account acceptance, Access revocation or Free-plan CPU measurement has been claimed. Missing `TINA_TOKEN` warnings during local builds are expected; the local API uses no token. Local admin authentication and its API override are explicitly restricted to the local build mode. Hosted mode uses TinaCloud's standard auth/media APIs.
