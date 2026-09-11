# Website development setup

This repository currently contains the website specifications and development
setup. The application has not been scaffolded yet. Read [SETUP.md](SETUP.md) for
machine requirements, agent configuration, credential checks and delivery controls.

## Local setup

```bash
nvm use
pnpm install --frozen-lockfile
pnpm check:setup
```

`.nvmrc` pins Node 24.21.0 and `package.json` pins pnpm 12.4.1, TypeScript 6.0.3
and `@astrojs/check` 0.9.10. Strict peer checking rejects incompatible dependency
combinations. Keep the committed skill files; restore missing skills from Git
as described in SETUP.md.

`pnpm check:setup` checks the skill hashes/symlinks and runs tests of the read-only
Cloudflare preflight, including missing credentials and secret-safe failures.
The setup workflow also runs these checks on GitHub.

`pnpm preflight:cloudflare` requires `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID`. Run it in GitHub Actions using the existing repository
secrets; local authentication is optional. It checks account read access and
workers.dev configuration without deploying or deleting anything.

## Pipeline proof

Run [prompts/dummy-site.md](prompts/dummy-site.md) to build and deploy a throwaway
site on a new branch. That run extends the existing manifest/lockfile, adds the
application scripts specified by R-07, and tests the deployment workflow. The
current setup workflow only validates tooling and Cloudflare read access.

The repository stays private without a paid GitHub upgrade. Validation must pass
before a site deployment runs. GitHub Free cannot enforce protected branches in
a private repository, so writers can still bypass or change those workflow checks.
