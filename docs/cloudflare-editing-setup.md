# Connect the private editing origin

Complete Cloudflare Access first; the maintainer then deploys the editor; finally you log in through the website to finish Tina's onboarding. Creating a Tina project or an Access application does not deploy the website. The AUD tag is a **Cloudflare Access application identifier** and is available before the website works.

## Where this setup stands — 16 September 2026

| Item                                       | Evidence and remaining work                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tina project and schema                    | You report both onboarding steps complete. The [cloud preview build](https://github.com/butterlyn/astro_website/actions/runs/34930269226) also passed schema checks and read both proof documents from TinaCloud.                                                                                                                                                                                                                               |
| GitHub Tina configuration                  | `TINA_PUBLIC_CLIENT_ID=2eba03c2-9aff-464b-9d99-7f7a1437577e` and the `TINA_TOKEN` secret are present. The successful build establishes that these work for development content reads.                                                                                                                                                                                                                                                           |
| Zero Trust organization and Free plan      | Team domain received: `tight-snowflake-ad6f.cloudflareaccess.com`; its public signing-key endpoint returns HTTP 200. The account association and Free plan remain unverified because the [account audit](https://github.com/butterlyn/astro_website/actions/runs/35060978938) receives HTTP 403 for the organization.                                                                                                                           |
| Editing Access application and email login | You confirm an application for `edit.leer.education` exists in the dashboard. Its AUD has been supplied and recorded in the Worker configuration; coverage, policy and matching API values still need verification. The updated audit finds zero account-level applications and no One-time PIN provider; domain-level Access reads return HTTP 403. Reconcile the selected account, application scope and token permissions before deployment. |
| Hosted editing website                     | Not deployed. The audit confirms that `leer-editing` and its custom-domain attachment are absent. The existing public site remains on `leer-preview`.                                                                                                                                                                                                                                                                                           |
| Tina “Log in through your site”            | Pending the editor deployment and your first browser login. This is the last part of the sequence below.                                                                                                                                                                                                                                                                                                                                        |

You do not need to repeat the completed Tina project or token setup. Browser login, hosted saves, the Tina token's branch restriction and plan entitlements still need their own checks; a successful content read does not prove them.

## 1. Confirm the Zero Trust organization

In the [Cloudflare dashboard](https://dash.cloudflare.com), select the **same account that contains `leer.education`**, then open **Zero Trust**.

- If you reach its dashboard, keep the existing organization.
- If onboarding asks for a team name, choose an available name for L.E.E.R., select **Zero Trust Free**, and finish onboarding. Cloudflare currently requires payment details even for the Free subscription; enter them only in Cloudflare's dashboard.

Open **Zero Trust → Settings → Team name and domain**. Copy the displayed team domain, such as `your-team.cloudflareaccess.com`, without `https://` or a path. Keep its existing value if already configured. [Organization setup and team-domain location](https://developers.cloudflare.com/learning-paths/clientless-access/initial-setup/create-zero-trust-org/).

**Checkpoint:** you can open the Zero Trust dashboard and identify your team domain.

## 2. Add One-time PIN login

Open **Zero Trust → Integrations → Identity providers**. Under **Your identity providers**, use the existing **One-time PIN** entry if present. Otherwise choose **Add new identity provider → One-time PIN**, complete the form and save it.

New organizations default to Cloudflare account login; One-time PIN is no longer added automatically. Adding this provider lets the allowed editor receive a login code at `admin@leer.education`. [Current One-time PIN instructions](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/).

**Checkpoint:** One-time PIN appears in the identity-provider list.

## 3. Create or check the editing Access application

Open **Zero Trust → Access controls → Applications**. If an application already covers `edit.leer.education`, choose **Configure** for it and check the settings below. Otherwise select **Create new application → Self-hosted and private**.

Use **Add public hostname** for the editing address:

| Field            | Value                                       |
| ---------------- | ------------------------------------------- |
| Application name | L.E.E.R. editing and review                 |
| Subdomain        | `edit`                                      |
| Domain           | `leer.education`                            |
| Path             | Leave empty, protecting the entire hostname |
| Session duration | 8 hours                                     |

Under **Access policies**, create and attach one policy with these settings:

| Field                   | Value                  |
| ----------------------- | ---------------------- |
| Policy name             | L.E.E.R. editor        |
| Action                  | Allow                  |
| Include selector        | Emails                 |
| Include value           | `admin@leer.education` |
| Require / Exclude rules | Leave empty            |

In the application's login methods, turn off **Accept all available identity providers** and select **One-time PIN** only. Leave Cloudflare One Client/WARP authentication and OPTIONS/preflight bypass disabled. Finish with **Create**, or save changes to the existing application. [Application setup](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/).

The deployment expects one application covering only `edit.leer.education` and one explicit email Allow policy. It rejects overlapping path/wildcard applications, additional policies and bypasses. Additional editors can be added later with a corresponding update to the approved identity list.

**Checkpoint:** Applications lists the saved editor application and its hostname. You can reach this checkpoint while `edit.leer.education` is still unavailable.

## 4. Find the AUD tag

From **Zero Trust → Access controls → Applications**, choose **Configure** for the editor application. Open **Additional settings**, find **Application Audience (AUD) Tag**, and copy the complete value. Cloudflare assigns it when the application is created. [Exact AUD location](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/).

The two public identifiers needed for deployment are:

| Identifier                             | Where to find it                                                    |
| -------------------------------------- | ------------------------------------------------------------------- |
| Team domain (`….cloudflareaccess.com`) | Zero Trust → Settings → Team name and domain                        |
| Application Audience (AUD) Tag         | Applications → editor application → Configure → Additional settings |

Share these identifiers with the maintainer. They can also be retrieved by the account audit once it has access. The Tina Client ID, Cloudflare account ID and Access application ID are separate identifiers; copying one of them into the AUD setting will not work.

## 5. Allow the deployment to verify Access

The GitHub-held Cloudflare token must read the organization, application, policy and login provider before deployment. The current organization request returns HTTP 403, so this check remains unresolved.

The [token audit](https://github.com/butterlyn/astro_website/actions/runs/35061754289) confirms that GitHub uses an active **account-owned token**, with an identifier ending in `2c65da49`. Open the account containing `leer.education`, then **Manage Account → Account API Tokens** ([direct dashboard link](https://dash.cloudflare.com/?to=/:account/api-tokens)). This token is managed there, rather than in the separate My Profile token list.

The original setup record says it was created on **11 September 2026** from the **Edit Cloudflare Workers** template. Look for that name or the name you gave the website/GitHub deployment token, open its menu and choose **Edit**. If there are several candidates, identify the deployment token before changing one. The identifier suffix is metadata, not part of the secret value. Cloudflare requires the account's Super Administrator role to manage account tokens. [Account token instructions](https://developers.cloudflare.com/fundamentals/api/get-started/account-owned-tokens/).

Under **Permissions**, keep the existing rows and add these two account permissions:

| Scope   | Permission                                            | Level |
| ------- | ----------------------------------------------------- | ----- |
| Account | Access: Apps and Policies                             | Read  |
| Account | Access: Organizations, Identity Providers, and Groups | Read  |

Under **Account Resources**, include the account containing `leer.education`. Retain the token's existing Worker and zone permissions, review the summary and save. The workflow uses these permissions to inspect your Access configuration; it does not create or alter it. [Token permissions and resource selection](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/), [application API](https://developers.cloudflare.com/api/resources/zero_trust/subresources/access/subresources/applications/methods/list/), [organization API](https://developers.cloudflare.com/api/resources/zero_trust/subresources/organizations/methods/list/).

Editing the existing token's permission policy does not require replacing its stored secret in GitHub. If you create a replacement token, put its value directly into **GitHub → astro_website → Settings → Secrets and variables → Actions → Secrets → `CLOUDFLARE_API_TOKEN` → Update**. Do not paste it into chat. If both permissions are already correct, report that and the account selected; the maintainer will rerun the audit rather than assuming the organization is missing.

**Checkpoint:** the maintainer reruns **Cloudflare topology audit** and can read the team domain, editor application/AUD, selected login provider and policy.

## 6. Maintainer deploys the editor

The maintainer checks the live Access settings, records `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` in `wrangler.editing.jsonc`, keeps `EDITOR_RECOVERY_EMAIL=admin@leer.education`, and enables the GitHub variable `EDITING_PREVIEW_DEPLOYMENT` after the source checks pass.

The **Editing preview** workflow builds against TinaCloud and deploys `leer-editing`. It creates the reservation's SQLite Durable Object, supplies the Worker runtime `TINA_TOKEN` secret, and attaches only `edit.leer.education`. This project uses a Worker custom domain, so you do not need to create a Tunnel, a separate hosting project or a DNS record by hand. The existing public `leer.education`/`www` setup is preserved.

**Checkpoint:** the workflow reports a successful deployment and an unauthenticated visit is sent to the Cloudflare Access login page. A successful build with the deployment job **skipped** has not published the editor.

## 7. Complete the first hosted login

After deployment is confirmed:

1. Open **https://edit.leer.education/edit/**.
2. At Cloudflare's login page, enter **admin@leer.education**, request the code and enter the code from your inbox.
3. On the website's editing page, reserve editing and open Tina.
4. Sign in to Tina with the account that has access to your TinaCloud project. This is a separate login from Cloudflare's email code.
5. Open the integration proof page. With the maintainer, test a small save and verify its commit lands on `development`.

This is the website-login stage of [Tina setup](tina-setup.md#4-complete-the-first-hosted-login). Direct `/admin/` entry redirects to `/edit/` until you hold a reservation. The proof page is the current editor test; full content migration follows hosted acceptance.

## If a checkpoint fails

| Symptom                                             | Next check                                                                                                                                                                                      |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No saved Access application                         | Finish step 3 before looking for its AUD.                                                                                                                                                       |
| `leer.education` is absent from the domain selector | Check the selected Cloudflare account.                                                                                                                                                          |
| Organization audit returns 403                      | Check step 1 and the token's permissions/account scope in step 5; 403 alone does not establish which is wrong.                                                                                  |
| Website unavailable before deployment               | Complete Access setup; the maintainer must deploy the Worker before testing website login.                                                                                                      |
| One-time PIN code never arrives                     | Check that the application's policy allows exactly `admin@leer.education`, that One-time PIN is selected, and check spam. Cloudflare can show “code sent” even when a policy blocks an address. |
| Cloudflare login works but Tina rejects the site    | In TinaCloud, open the project → Configuration → Site URL(s) and check `https://edit.leer.education` is included as an origin.                                                                  |

## Maintainer acceptance and deployment controls

The workflow accepts successful trusted `development` push checks or owner dispatch on `development`. It requires both current-source checks, proves unauthenticated rejection on the cloud artifact, and checks the artifact digest, live Access protection and source revision before upload. The Worker verifies Access signatures and audience before serving assets or routes. `workers_dev` and `preview_urls` remain disabled.

Deployments are serialized. Set `EDITING_PREVIEW_DEPLOYMENT=enabled` to enable them or `paused` to stop subsequent deployments; changing the variable does not cancel an upload already in progress. Public release deployment is separate and remains unimplemented.

Before inviting the team, exercise permitted and denied email logins, editor/media/refresh paths, expiry/revocation, Tina authentication, actual development-only writes and manual recovery. Record CPU/quotas on the actual Free plan. Account setup and the first login alone do not satisfy those remaining acceptance checks.
