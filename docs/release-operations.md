# Bootstrap release operations

The release-PR helper is implemented and tested. Production deployment/recovery and the hosted preview remain gated on the plan's account/runtime evidence. **This bootstrap cannot publish the public site.** No production or preview deployment workflow is installed yet, and neither new Wrangler target has a public hostname mapping.

`development` is the integration/default branch. `main` remains the release branch. Existing `Setup validation` protection is retained. `Website validation` adds source, schema, target, runtime and browser checks without deployment credentials.

Set repository variable `RELEASE_PR_AUTOMATION` to `enabled` to create/reuse a native draft `development` → `main` release PR. Set it to `paused` to stop creation. Missing configuration also pauses bootstrap. Manual dispatch must select `development`. The helper only reads branch/PR state and creates a PR; it has no commit, approval, merge, comment or branch-deletion operations.

An existing PR's title, body, discussion and draft/readiness state remain untouched. Closing it manually does not trigger replacement; the next unpaused development push can create another. Ambiguous history or duplicates require human attention. A permission failure must be fixed in the Actions repository setting that permits PR creation; the setting's combined approval wording does not authorize this helper to approve anything.

Use normal merge commits for releases. After a release/hotfix, a maintainer merges `main` back into `development`, preserving unpublished work. The helper never synchronizes branches. If histories diverge, reconcile them before preparing a new release; no force reset or repeated squash merge is part of this workflow.

The originator is `butterlyn`, currently the only repository collaborator. No agent or bot may make the deliberate publication decision. Keep the prototype labelled and noindex when approved test releases eventually begin.

The planned production workflow must still verify an owner-merged, same-repository release PR, exact merge revision, passing checks and the tested artifact digest. It must serialize final deployments and reject stale branch revisions. Recovery must separately verify an earlier approved revision, pause normal publication, invalidate queued normal runs and preserve current drafts. These are outstanding implementation requirements, not capabilities of this bootstrap.

The existing public Worker may be `leer-preview`; its name does not prove it is disposable. Run the owner-only **Cloudflare topology audit** dispatch after it exists on the default branch, then verify zone routes, `www` redirects, Access and competing build integrations. Never run the historical dummy cleanup script as part of editor setup.
