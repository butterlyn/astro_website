# Set up TinaCloud

The local proof needs no Tina account. The shared hosted editor needs a TinaCloud project, a [protected Cloudflare origin](cloudflare-editing-setup.md) and the live acceptance checks in [implementation-status.md](implementation-status.md). Initial Access/recovery identity: **admin@leer.education**.

## Current onboarding status — 16 September 2026

| TinaCloud checklist item | Current status                                                                                                                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create the Project       | Complete, as reported in the dashboard. Client ID: `2eba03c2-9aff-464b-9d99-7f7a1437577e`.                                                                                                   |
| Set up your site schema  | Complete, as reported in the dashboard. Our [cloud preview build](https://github.com/butterlyn/astro_website/actions/runs/34930269226) also validated the schema and read the proof content. |
| Log in through your site | Pending. Cloudflare Access must be configured and the editor deployed first.                                                                                                                 |

The GitHub Client ID variable and `TINA_TOKEN` secret are already configured and work for development content reads. **Continue with [Cloudflare setup](cloudflare-editing-setup.md), then return to step 4 below.** You do not need to create another Tina project, regenerate the token or repeat schema setup to make the hostname work. The dashboard checklist does not host the site.

## 1. Prepare the repository

Before connecting Tina, check that GitHub's default branch is `development` and that it contains `tina/config.ts`, `tina/tina-lock.json` and `content/proof/`. Standard repository media follows the default branch, independently of the editor's selected branch. Creating a Tina project also starts an initial media sync. [Repository media](https://tina.io/docs/reference/media/repo-based), [project setup](https://tina.io/docs/tinacloud/dashboard/projects).

The implementation worktree is `/home/butterlyn/worktrees/astro-website-development`. The original checkout and its staged requirements are preserved.

## 2. Create the project

Open [TinaCloud](https://app.tina.io), create/sign into your team-controlled Tina account, and choose to connect an **existing GitHub repository**. Authorize the GitHub connection as `butterlyn` and limit the installation to `butterlyn/astro_website` where GitHub offers repository selection.

Use these settings:

| Setting                      | Value                                               |
| ---------------------------- | --------------------------------------------------- |
| Project name                 | L.E.E.R. website                                    |
| Repository                   | `butterlyn/astro_website`                           |
| Branch, where requested      | `development`                                       |
| Hosted site URL              | `https://edit.leer.education`                       |
| Local site URLs              | `http://127.0.0.1:4321` and `http://localhost:4321` |
| Path to Tina / monorepo path | Leave blank; `tina/` is at the repository root      |

Use exact origins without `/admin` or wildcard hostnames. The public company origin does not host an editor. These fields and the Client ID are described in [Tina's project documentation](https://tina.io/docs/tinacloud/dashboard/projects).

## 3. Configure the project ID and token

Copy the **Client ID** from the project's Overview page. This identifier is not a secret. In Tokens, create a **Content (read-only)** token named `development-preview` and restrict its Git Branches to `development`. Search credentials are unnecessary for this proof. Content tokens read content; browser saves use Tina login separately. [Token controls](https://tina.io/docs/tinacloud/dashboard/projects#tokens-tab).

In [GitHub Actions settings](https://github.com/butterlyn/astro_website/settings/secrets/actions), add:

| Location  | Name                    | Value                              |
| --------- | ----------------------- | ---------------------------------- |
| Variables | `TINA_PUBLIC_CLIENT_ID` | The Client ID                      |
| Secrets   | `TINA_TOKEN`            | The development-only content token |

For optional local maintainer builds, run `cp .env.example .env` in the implementation worktree, then edit `.env` in your editor. Fill in the two Tina values; retain both `development` branch values. This local file is not required for the hosted GitHub deployment. Do not paste the token into chat, shell arguments, screenshots or Issues. `.env` is ignored by Git.

The editing Worker reads its content token from the separate `TINA_TOKEN` **runtime secret**. It is not compiled into the Worker or browser bundle. Provision that secret through the trusted preview deployment setup once Access is configured. GitHub secrets do not automatically become Worker secrets.

Send the maintainer the Client ID and confirmation that the GitHub secret is configured; no token value is needed in the conversation.

## 4. Complete the first hosted login

**This step starts after the Cloudflare editor has been deployed.** Completing steps 1–3 connects Tina to GitHub; it does not create `edit.leer.education`. Follow [the Cloudflare setup](cloudflare-editing-setup.md) with the maintainer first. A missing admin page at this point does not indicate an incorrect Tina token.

Before the first login, open **TinaCloud → your project → Configuration → Site URL(s)** and confirm `https://edit.leer.education` is included. This is an allowed origin, so leave off `/edit/` and `/admin/`. A successful build checks schema/content access but cannot establish that this browser setting is correct. [Project configuration](https://tina.io/docs/tinacloud/dashboard/projects#configuration-tab).

Once the maintainer confirms deployment:

1. Open **https://edit.leer.education/edit/**.
2. Sign in through Cloudflare using the code emailed to `admin@leer.education`.
3. Reserve editing on the website and open the editor.
4. Complete Tina's separate sign-in with the account that owns or can access the TinaCloud project.
5. Open **Integration proof pages → Editing workflow proof**. If Tina offers **Enter Edit Mode**, select it.

`/admin/` requires an active reservation and redirects to `/edit/` when opened directly. This first real Tina login is the stage referred to by “Log in through your site”; it cannot be exercised while the site is unavailable. Record whether the editor opens and can load its proof document, even if the dashboard checklist does not immediately reflect it.

## 5. Verify before onboarding the team

Wait for Tina to index the committed schema. If indexing fails, inspect its error and the committed lock file before using reindex/reset controls. Confirm a hosted text save writes only to `development`, and inspect real upload/deletion commits after the media proof is enabled.

The Free plan advertises two users. Four people sharing one login has **not** been established as one allowed user; confirm the actual entitlement with Tina before onboarding all four. A working shared login is separate evidence from seat eligibility. Personal GitHub and Cloudflare accounts remain individual. [Tina pricing](https://tina.io/pricing), [recorded account research](../specs/research/workflow-feasibility-2026-09-15.md).

Cloudflare Access initially allows `admin@leer.education`. The remaining individual addresses must be added explicitly. Their Access permissions do not revoke retained shared Tina credentials; offboarding also requires shared-credential/session recovery.

## Local proof commands

```bash
pnpm install --frozen-lockfile
pnpm types:worker
pnpm tina:schema
pnpm dev:tina
```

Open `http://127.0.0.1:4321/edit/`, reserve editing, and select **Enter Edit Mode** when shown. Open Tina's navigation menu, select **Integration proof pages**, then **Editing workflow proof**. The fixture exercises rich text, nested/reordered cards, image/alt fields and shared content. Only this representative proof is migrated so far; the saved placeholder remains the starting design until hosted Phase 2 acceptance passes.

Local saves modify this worktree. They do not create a GitHub commit or update the shared hosted site. Startup builds the Worker and admin before serving them, which takes about a minute. Restart after Astro component/schema changes or uploads to include new media assets; text saves and contextual refreshes are live. Use `pnpm test:editing` for the automated local runtime checks. Never expose the unauthenticated local Tina API on the internet.
