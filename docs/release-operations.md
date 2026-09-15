# Bootstrap release operations

The release-PR helper is implemented and tested. Production deployment/recovery and the hosted preview remain gated on the plan's account/runtime evidence. **This bootstrap cannot publish the public site.** No production or preview deployment workflow is installed yet, and neither new Wrangler target has a public hostname mapping.

`development` is the integration/default branch. `main` remains the release branch. Both `Setup validation` and `Website validation` are required, retaining strict up-to-date checking and the existing publication controls. Website checks cover source, schema, targets, runtime and browsers without deployment credentials.

Set repository variable `RELEASE_PR_AUTOMATION` to `enabled` to create/reuse a native draft `development` → `main` release PR. Set it to `paused` to stop creation. Missing configuration also pauses bootstrap. Manual dispatch must select `development`. The helper only reads branch/PR state and creates a PR; it has no commit, approval, merge, comment or branch-deletion operations.

Bootstrap enabled this variable and GitHub's combined PR creation/approval setting while retaining read-only default tokens. The helper created [draft PR #3](https://github.com/butterlyn/astro_website/pull/3); a second dispatch reused it without changing its draft state. GitHub requires execution approval for PR workflows triggered by a `GITHUB_TOKEN`-created PR. A maintainer approved these credential-free validation runs during bootstrap; this approves running tests only. The helper does not approve workflow runs or publication. Ordinary development push validation also runs independently. [GitHub token behaviour](https://docs.github.com/en/actions/concepts/security/github_token).

An existing PR's title, body, discussion and draft/readiness state remain untouched. Closing it manually does not trigger replacement; the next unpaused development push can create another. Ambiguous history or duplicates require human attention. A permission failure must be fixed in the Actions repository setting that permits PR creation; the setting's combined approval wording does not authorize this helper to approve anything.

Use normal merge commits for releases. After a release/hotfix, a maintainer merges `main` back into `development`, preserving unpublished work. The helper never synchronizes branches. If histories diverge, reconcile them before preparing a new release; no force reset or repeated squash merge is part of this workflow.

The originator is `butterlyn`, currently the only repository collaborator. No agent or bot may make the deliberate publication decision. Keep the prototype labelled and noindex when approved test releases eventually begin.

The planned production workflow must still verify an owner-merged, same-repository release PR, exact merge revision, passing checks and the tested artifact digest. It must serialize final deployments and reject stale branch revisions. Recovery must separately verify an earlier approved revision, pause normal publication, invalidate queued normal runs and preserve current drafts. These are outstanding implementation requirements, not capabilities of this bootstrap.

The existing public Worker may be `leer-preview`; its name does not prove it is disposable. Run the owner-only **Cloudflare topology audit** dispatch after it exists on the default branch, then verify zone routes, `www` redirects, Access and competing build integrations. Never run the historical dummy cleanup script as part of editor setup.
