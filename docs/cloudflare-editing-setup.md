# Connect the private editing origin

This is the pending account setup for the hosted proof. The repository contains the Worker and reservation, but no hosted editor is deployed yet. Prepare [TinaCloud](tina-setup.md) first. Preserve the existing public Worker and apex/`www` configuration.

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

Create this protection before attaching the hostname to the editing Worker. Add subsequent people as individual email entries. Do not add an Everyone or Bypass policy. [Application setup](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/).

Record the application's **AUD tag** and the team domain; neither is a secret. These fill `ACCESS_AUD` and `ACCESS_TEAM_DOMAIN` in `wrangler.editing.jsonc`. Keep `EDITOR_RECOVERY_EMAIL=admin@leer.education`.

The maintainer then completes the trusted development-preview workflow, provisions `leer-editing` with its SQLite Durable Object, supplies the separate `TINA_TOKEN` Worker secret, and attaches only `edit.leer.education`. Keep `workers_dev` and `preview_urls` disabled. The Worker verifies Access signatures and audience before serving either assets or routes. A local proof artifact is rejected by deployment verification.

Before inviting the team, exercise permitted and denied email logins, all editor/media/refresh paths, expiry/revocation, Tina authentication, actual development-only writes and manual recovery. Record CPU/quotas on the actual Free plan. Account setup alone does not satisfy those remaining acceptance checks.
