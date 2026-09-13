# Trial OAuth component

The official [Sveltia CMS Authenticator](https://github.com/sveltia/sveltia-cms-auth)
is vendored unchanged in `vendor/index.js`, with its MIT license. Source commit:
[`f3beae35865b49c91f8d98d89f0eed5fbb49167f`](https://github.com/sveltia/sveltia-cms-auth/tree/f3beae35865b49c91f8d98d89f0eed5fbb49167f).
It has no runtime package dependencies. Use this repository's pinned Wrangler.

GitHub Actions deploys only `leer-sveltia-auth`, using the adjacent config.
The allowed hostnames cover the hosted editor and local development. Draft
preview origins are intentionally not OAuth entry points; use the main editor
URL to sign in. The authenticator matches hostnames, not ports.

OAuth client credentials are Worker secrets, supplied by the trial workflow
from `SVELTIA_GITHUB_CLIENT_ID` and `SVELTIA_GITHUB_CLIENT_SECRET` GitHub secrets.
The client secret and Cloudflare token never enter the static site. Sveltia's
real browser client receives an individual OAuth access token to use GitHub's
API; this is inherent to its documented architecture. Sign out on shared
computers. Request logging and traces are disabled for this trial OAuth Worker
to avoid retaining callback query strings.

See [the hands-on guide](../../SVELTIA-TRIAL.md) for account setup and removal.
