# Connect the private editing origin

This is the pending account setup for the hosted proof. The repository contains the Worker, reservation and trusted preview workflow, but no hosted editor is deployed yet. The Tina Client ID and GitHub content secret were configured on 15 September 2026. Completing Tina setup alone does not create the editing hostname. Preserve the existing public Worker and apex/`www` configuration.

In Cloudflare's Zero Trust dashboard, create or open the team's organization and record its `*.cloudflareaccess.com` team domain. Use the selected Free plan and verify its current entitlement. Enable **One-time PIN** as an identity provider. [Email login documentation](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/).

Under **Access controls → Applications**, create a self-hosted application with a public hostname:

| Setting          | Selected value                                     |
| ---------------- | -------------------------------------------------- |
| Name             | L.E.E.R. editing and review                        |
| Hostname         | `edit.leer.education`                              |
| Path             | Blank, covering the whole hostname                 |
| Allow policy     | Emails: `admin@leer.education`                     |
| Login            | One-time PIN                                       |
| Session duration | 8 hours initially; verify expiry during acceptance |

Create this protection before attaching the hostname to the editing Worker. In the application's login methods, turn off **Accept all available identity providers** and select **One-time PIN** only. Leave WARP authentication and OPTIONS/preflight bypass disabled. Add subsequent people as individual email entries after updating the deployment's approved identity list. Do not add an Everyone or Bypass policy. [Application setup](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/).

Record the application's **AUD tag** and the team domain; neither is a secret. These fill `ACCESS_AUD` and `ACCESS_TEAM_DOMAIN` in `wrangler.editing.jsonc`. Keep `EDITOR_RECOVERY_EMAIL=admin@leer.education`.

The 15 September read-only audit confirmed that the existing GitHub-held Cloudflare token can inspect Workers/custom domains and zone Worker routes, but Access organization, application and identity-provider requests return HTTP 403. In **My Profile → API Tokens**, edit the token used for `CLOUDFLARE_API_TOKEN` and add these permissions, restricted to this Cloudflare account:

| Scope   | Permission                                            | Level |
| ------- | ----------------------------------------------------- | ----- |
| Account | Access: Apps and Policies                             | Read  |
| Account | Access: Organizations, Identity Providers, and Groups | Read  |

Retain its existing Worker and zone permissions. If you replace the token instead of changing its permissions, update the GitHub secret with the replacement. Send only confirmation and the public team domain/AUD; do not paste token values into chat. These read permissions let deployment verify the protection you created; the workflow does not create or change Access policies. [Application API permissions](https://developers.cloudflare.com/api/resources/zero_trust/subresources/access/subresources/applications/methods/list/), [organization API permissions](https://developers.cloudflare.com/api/resources/zero_trust/subresources/organizations/methods/list/).

After verifying this setup, the maintainer records the public team domain/AUD in `wrangler.editing.jsonc` and sets the GitHub variable `EDITING_PREVIEW_DEPLOYMENT=enabled`. The **Editing preview** workflow provisions `leer-editing` with its SQLite Durable Object, supplies `TINA_TOKEN` as a Worker runtime secret in the same upload, and attaches only `edit.leer.education`. Keep `workers_dev` and `preview_urls` disabled. A local proof artifact is rejected by deployment verification. The Worker verifies Access signatures and audience before serving either assets or routes.

The workflow runs after successful trusted `development` push checks, or by owner dispatch on `development`. It requires both current-source checks, builds against TinaCloud, proves unauthenticated rejection on the built Worker, and verifies the artifact digest again before uploading. It checks live Access coverage and the source revision immediately before deployment. Deployments are serialized. Set `EDITING_PREVIEW_DEPLOYMENT=paused` to stop subsequent deployments; this does not cancel an upload already in progress. Public release deployment is separate and remains unimplemented.

Once the workflow reports a successful deployment, open **https://edit.leer.education/edit/**. Sign in with the allowed email, reserve editing, and then open Tina. Direct `/admin/` entry redirects to `/edit/` until you hold a reservation. No DNS entry or separate editor hosting needs to be created by hand: Wrangler attaches the protected custom domain after verification.

Before inviting the team, exercise permitted and denied email logins, all editor/media/refresh paths, expiry/revocation, Tina authentication, actual development-only writes and manual recovery. Record CPU/quotas on the actual Free plan. Account setup alone does not satisfy those remaining acceptance checks.
