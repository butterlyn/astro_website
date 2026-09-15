import assert from "node:assert/strict";

const hostname = "edit.leer.education";

export function validateEditingDeploymentConfig(config) {
  assert.equal(
    config.name,
    "leer-editing",
    "Only the editing Worker is deployable here",
  );
  assert.equal(config.workers_dev, false);
  assert.equal(config.preview_urls, false);
  assert.equal(config.assets?.run_worker_first, true);
  assert.deepEqual(config.routes, [{ pattern: hostname, custom_domain: true }]);
  assert.match(
    config.vars?.ACCESS_TEAM_DOMAIN ?? "",
    /^[a-z0-9-]+\.cloudflareaccess\.com$/,
  );
  assert.match(config.vars?.ACCESS_AUD ?? "", /^[a-f0-9]{64}$/);
  assert.equal(config.vars?.EDITOR_RECOVERY_EMAIL, "admin@leer.education");
}

export async function cloudflareGet(path) {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!/^[a-f0-9]{32}$/i.test(account ?? "") || !token)
    throw new Error("Cloudflare account/token configuration is missing.");
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}${path}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(
      `Cloudflare protection verification failed (HTTP ${response.status}).`,
    );
  }
  const data = await response.json();
  if (data.success !== true || data.result === undefined)
    throw new Error(
      "Cloudflare returned an invalid protection-verification response.",
    );
  return data;
}

async function list(path, get) {
  const items = [];
  for (let page = 1; page <= 25; page++) {
    const data = await get(`${path}?per_page=100&page=${page}`);
    if (!Array.isArray(data.result))
      throw new Error("Expected a Cloudflare list.");
    items.push(...data.result);
    if (
      (data.result_info?.total_pages !== undefined &&
        page >= data.result_info.total_pages) ||
      (data.result_info?.total_pages === undefined && data.result.length < 100)
    )
      return items;
  }
  throw new Error(
    "Cloudflare protection listing exceeded its verification bound.",
  );
}

function destinations(app) {
  return app.destinations?.length
    ? app.destinations
        .filter((item) => item.type === "public")
        .map((item) => item.uri)
    : app.self_hosted_domains?.length
      ? app.self_hosted_domains
      : [app.domain].filter(Boolean);
}

function coversHostname(destination) {
  if (typeof destination !== "string") return false;
  const host = destination.replace(/^https?:\/\//, "").split("/")[0];
  const pattern = host
    .split("*")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${pattern}$`, "i").test(hostname);
}

export async function verifyEditingAccess(config, get = cloudflareGet) {
  validateEditingDeploymentConfig(config);
  const { result: organization } = await get("/access/organizations");
  assert.equal(
    organization.auth_domain,
    config.vars.ACCESS_TEAM_DOMAIN,
    "Access team domain differs from the artifact",
  );
  const apps = await list("/access/apps", get);
  const matching = apps.filter((app) => destinations(app).some(coversHostname));
  assert.equal(
    matching.length,
    1,
    "Exactly one whole-host Access application must cover the editor; reconcile overlapping path/wildcard applications first",
  );
  const app = matching[0];
  assert.equal(app.type, "self_hosted");
  assert.deepEqual(
    destinations(app),
    [hostname],
    "The editor needs its own whole-host application",
  );
  assert.equal(
    app.aud,
    config.vars.ACCESS_AUD,
    "Access audience differs from the artifact",
  );
  assert.equal(
    app.session_duration,
    "8h",
    "Reconcile session duration with the accepted setup",
  );
  assert.notEqual(app.allow_authenticate_via_warp, true);
  assert.notEqual(app.options_preflight_bypass, true);
  const providers = await list("/access/identity_providers", get);
  assert.equal(
    app.allowed_idps?.length,
    1,
    "Select only One-time PIN for this application",
  );
  assert.ok(
    providers.some(
      (provider) =>
        provider.id === app.allowed_idps[0] && provider.type === "onetimepin",
    ),
    "The selected login provider must be One-time PIN",
  );
  const policies = await list(`/access/apps/${app.id}/policies`, get);
  assert.equal(
    policies.length,
    1,
    "The initial editor requires its explicit email Allow policy only",
  );
  const policy = policies[0];
  assert.equal(policy.decision, "allow");
  assert.deepEqual(
    policy.include,
    [{ email: { email: "admin@leer.education" } }],
    "The initial policy must allow only the selected editor",
  );
  assert.equal(policy.exclude?.length ?? 0, 0);
  assert.equal(policy.require?.length ?? 0, 0);

  const { result: domains } = await get("/workers/domains");
  assert.ok(Array.isArray(domains));
  for (const domain of domains) {
    if (domain.hostname === hostname)
      assert.equal(
        domain.service,
        "leer-editing",
        "The editing hostname already belongs to another Worker",
      );
    if (["leer.education", "www.leer.education"].includes(domain.hostname))
      assert.notEqual(
        domain.service,
        "leer-editing",
        "The editing Worker must never serve a public hostname",
      );
  }
  return { hostname, teamDomain: organization.auth_domain, audience: app.aud };
}
