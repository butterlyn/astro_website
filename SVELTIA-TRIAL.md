# Sveltia CMS hands-on trial

This alternative starts at Markdown baseline `cdd75a58`, on `trial/sveltia`.
It uses the real Sveltia CMS **0.211.4** with GitHub OAuth and editorial workflow.
The Markdown, schema, Astro layouts, design and intent/spec remain unchanged.
No adoption decision or editing walkthrough has been performed for you.

## Open the trial

| Purpose                                  | URL                                                                              |
| ---------------------------------------- | -------------------------------------------------------------------------------- |
| Editor (after administrator setup below) | <https://leer-sveltia.butterlyn.workers.dev/admin/>                              |
| Published trial homepage                 | <https://leer-sveltia.butterlyn.workers.dev/>                                    |
| Published trial page list                | <https://leer-sveltia.butterlyn.workers.dev/pages/>                              |
| Published sample guide                   | <https://leer-sveltia.butterlyn.workers.dev/pages/sample-guide/>                 |
| GitHub branch                            | <https://github.com/butterlyn/astro_website/tree/trial/sveltia>                  |
| Build/deploy progress                    | <https://github.com/butterlyn/astro_website/actions/workflows/sveltia-trial.yml> |

The OAuth service is `https://leer-sveltia-auth.butterlyn.workers.dev`; its root
returns 404 by design. Sign in from the editor, not the authenticator URL.
These Workers are separate from `leer-preview` and every other trial.

## One-time administrator setup

**Credentials added by the administrator.** The steps below are retained for
recreating the trial; routine editors start with Sign In with GitHub. This follows Sveltia's documented
[GitHub authorization-code flow](https://sveltiacms.app/en/docs/backends/github)
and [official authenticator setup](https://github.com/sveltia/sveltia-cms-auth).

1. Open <https://github.com/settings/applications/new>. Create an **OAuth App**,
   with application name `L.E.E.R. Sveltia trial`, homepage
   `https://leer-sveltia.butterlyn.workers.dev/admin/`, and authorization callback
   **`https://leer-sveltia-auth.butterlyn.workers.dev/callback`**. Leave device
   flow off. Generate a new client secret.
2. At <https://github.com/butterlyn/astro_website/settings/secrets/actions>, add
   repository Actions secrets `SVELTIA_GITHUB_CLIENT_ID` (the app's Client ID)
   and `SVELTIA_GITHUB_CLIENT_SECRET` (its generated secret). Do not paste them
   into CMS config, source, chat or a browser console. The existing
   `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are reused by Actions.
3. Open the **latest push run on `trial/sveltia`** in the Actions URL above and
   select **Re-run all jobs**. This uploads the two values as encrypted secrets
   to `leer-sveltia-auth` and deploys the site. No local deployment command is
   needed. If an older run says it was superseded, use the newest push run.
4. Open the editor and select **Sign In with GitHub**, allowing its popup and
   authorizing the app. The trial requests `public_repo`, since this repository
   is public. GitHub OAuth grants are not restricted to a single branch or
   repository; the CMS configuration targets `trial/sveltia` explicitly.

For a second editor, invite their own GitHub account through
<https://github.com/butterlyn/astro_website/settings/access>. They must accept
the invitation and have repository write access. They then open the same editor
URL and authorize the same OAuth app. They need no Cloudflare account, token,
terminal, Git commands or separate OAuth app. Do not share your login. If moved
to an organization later, its OAuth access/SSO policy also needs administrator
approval. Read-only visitors can view the hosted preview without CMS access.

## Routine actions for you to try

Use the hosted editor, sign in, and leave all wording and imagery choices to
yourself. These actions have deliberately **not** been run during setup.

1. Open **Homepage → Homepage** or **Pages → Sample guide**. Edit an existing
   field and some prose using the rich-text Markdown toolbar. The homepage also
   exposes its button, image, alt text, caption and exactly three cards.
2. **Save** and choose **Later** when asked about review. Return to the content
   list or Editorial Workflow board, then reopen the saved draft.
3. Use **Send for Review** (or the status control to choose **In Review**).
   Open **View Preview** once the build finishes. Return to the same entry to
   revise it. Your collaborator can open it with their own login.
4. Review the result, move it to **Ready**, and **Publish**. A user permitted
   to merge the pull request must do this. Wait for Actions, then refresh the
   published trial URL.
5. Under **Pages**, create a **new Page** with your own title, introduction and
   Markdown body. Use a unique lowercase URL name with hyphens when choosing
   its slug. Save, review and publish when ready; its URL is
   `/pages/<filename>/` and it appears automatically in `/pages/`. No route or
   navigation code needs changing.
6. Make a separate unwanted draft. Use **Discard** for an unpublished change
   to an existing page; use **Delete** for a never-published new entry. Check
   the confirmation describes the draft you intend to remove. Deleting a
   published page instead proposes a page deletion.

Sveltia implements these actions using pull requests and its own status labels.
See its [editorial workflow](https://sveltiacms.app/en/docs/workflows/editorial).
Your account can simulate drafting, review status changes and publishing.
**Status labels do not enforce a separation of editor and reviewer.** No trial
review requirement or new branch protection has been installed. Repository
permissions and any applicable GitHub rules govern merging; a maintainer must
resolve a blocked merge without bypassing those rules. A distinct person's
required GitHub approval cannot be simulated by approving your own PR; GitHub
[does not allow authors to approve their own pull requests](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/approving-a-pull-request-with-required-reviews).

## Saves, media and the three kinds of preview

Saves go to GitHub, not to files in your local worktree. Drafts use
`cms/sveltia_homepage/<slug>` or `cms/sveltia_pages/<slug>` branches, with PRs
targeting **`trial/sveltia`** and `sveltia-trial/` labels. Publishing merges the
PR into that trial branch. The inherited Markdown files remain authoritative:
`src/content/homepage/home.md`, `src/content/pages/*.md`, and `public/images/`.

| View                              | What it shows and when it changes                                                                                                                                                                                                                                 |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CMS internal preview              | Sveltia's own field/Markdown rendering while editing. It is not the Astro page layout; no custom preview imitation is installed.                                                                                                                                  |
| **View Preview** on a saved draft | A complete Astro build including that PR's saved content. Actions reports the `sveltia/preview` commit status. Its URL is `https://pr-<PR-number>-leer-sveltia.butterlyn.workers.dev`, plus `/` or `/pages/<filename>/`. Saving again rebuilds that PR's preview. |
| Published trial site              | Content merged into `trial/sveltia`, after its push build/deploy completes. Other pending drafts are excluded.                                                                                                                                                    |

The [Sveltia deploy-preview integration](https://sveltiacms.app/en/docs/workflows/deploy-previews)
uses GitHub's commit status URL. Before a first successful build, wait for that
status: opening the published site does not show an unpublished entry. Draft
builds can fail if required metadata is empty; fill it in and save again. The
existing Astro schema stays strict. On a failed build, an older preview URL
can still show the previous successful save; check the commit/status in Actions.

Images remain `/images/...` references. The existing SVG artwork and mark are
available in the image picker. Upload controls use the real Sveltia media
library. **Standalone Asset Library uploads, replacements and deletions write
directly to the configured branch**; do not assume media operations are held
for entry review. Replacing an already-used filename can affect the trial site
on its next build. Use a new filename for experimental uploads. Discarding an
entry draft does not undo an independently committed media upload.

Remote previews and repository history are public, with indexing disabled.
Noindex is not access control. Cloudflare's native
[version previews](https://developers.cloudflare.com/workers/versions-and-deployments/preview-urls/)
remain reachable after a PR is closed or discarded; discard removes the pending
Git change, not previously uploaded preview snapshots. Trial removal below
removes all of this Worker's preview URLs.

## Local access and lifecycle

Stakeholders only need the hosted editor. For local administration:

```bash
cd /mnt/c/Users/Butte/Documents/Coding/astro_website-trials/02-sveltia
nvm use
pnpm install --frozen-lockfile
pnpm dev:sveltia
```

Open <http://localhost:4402/> or <http://localhost:4402/admin/>. The explicit
startup command is `pnpm dev --host 127.0.0.1 --port 4402`. Use **Sign In with
GitHub** for the editorial trial even on localhost; Sveltia's separate **Work
with Local Repository** option does not exercise remote editorial workflow.
GitHub saves do not automatically refresh your local checkout. An administrator
can run `git pull --ff-only origin trial/sveltia` after preserving local work,
then Astro refreshes its local content. Stakeholders need not do this.

Astro is loopback-only. Sending its localhost URL to a second person does not
give them access. The hosted editor and previews work while this PC is off.
The pinned CMS bundle loads from jsDelivr; GitHub/OAuth access needs the internet.

Stop a foreground server with **Ctrl+C**. For Astro's managed server in this
worktree, use `pnpm dev status` and `pnpm dev stop`; restart with
`pnpm dev:sveltia`. If an automatic background start times out on this WSL
drive, run the same startup command in your own interactive terminal and allow
it to finish starting.

An optional built-site check is `pnpm build` then `pnpm preview:sveltia`, at
<http://127.0.0.1:4520/> (inspector 4521). It refreshes only after rebuilding;
stop with Ctrl+C. No local OAuth/helper server is required. Do not use the
inherited `preview:cloudflare`, deploy or cleanup commands for this trial.

To remove the trial, preserve any wanted content first. Disable **Sveltia
trial** in its GitHub Actions workflow menu and wait for running jobs to end.
In Cloudflare **Workers & Pages**, delete only `leer-sveltia` and
`leer-sveltia-auth`. Delete the dedicated OAuth App in GitHub Developer settings
and the two `SVELTIA_GITHUB_CLIENT_*` Actions secrets. Keep the shared Cloudflare
secrets, `leer-preview`, production settings and other trials. Close only this
trial's remaining CMS PRs and remove their matching draft branches.

Stop local servers and inspect `git status --short`. From outside this worktree,
remove only this worktree with `git worktree remove
/mnt/c/Users/Butte/Documents/Coding/astro_website-trials/02-sveltia` after saving
its untracked handoff and any wanted work; do not force removal. Delete only
`trial/sveltia` locally/remotely when its work is no longer wanted. Keep the
Markdown baseline branch and tag. No paid plan or usage upgrade is part of this
trial; it uses the existing public-repository Actions and Workers free options.

## Setup checks and your first login

Setup checks cover installation, type/build/package checks, initial page loads
and the OAuth popup reaching GitHub's sign-in page. No content-editing scenarios, publishing/discard exercises, role test or
automated evaluation suite were run. The OAuth app credentials are supplied;
authorizing the app in your own browser and the first real draft/review/publish
walkthrough remain yours to perform. No successful signed-in editing session
is claimed as part of setup.
