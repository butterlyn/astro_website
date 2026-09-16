// Read-only topology audit using GitHub-held secrets. Do not print complete
// API responses, account IDs, tokens, Access identities or unrelated domains.
const account = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
if (!account || !/^[a-f0-9]{32}$/i.test(account) || !token)
  throw new Error("Cloudflare account/token configuration is missing.");

async function get(path, scope = `accounts/${account}`) {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/${scope}${path}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        redirect: "error",
        signal: AbortSignal.timeout(15_000),
      },
    );
    const data = await response.json().catch(() => null);
    if (!response.ok || data?.success !== true) {
      // Error messages may contain account details. Only expose numeric codes.
      const errorCodes = Array.isArray(data?.errors)
        ? data.errors.map((error) => error.code).filter(Number.isSafeInteger)
        : [];
      return {
        available: false,
        status: response.ok ? "invalid_response" : response.status,
        errorCodes,
      };
    }
    if (data.result === undefined)
      return { available: false, status: "invalid_response" };
    return {
      available: true,
      result: data.result,
      resultInfo: data.result_info,
    };
  } catch {
    return { available: false, status: "request_failed" };
  }
}

async function list(path) {
  const result = [];
  for (let page = 1; page <= 25; page++) {
    const data = await get(`${path}?per_page=100&page=${page}`);
    if (!data.available) return data;
    if (!Array.isArray(data.result))
      return { available: false, status: "invalid_response" };
    result.push(...data.result);
    if (
      (data.resultInfo?.total_pages !== undefined &&
        page >= data.resultInfo.total_pages) ||
      (data.resultInfo?.total_pages === undefined && data.result.length < 100)
    )
      return { available: true, result };
  }
  return { available: false, status: "pagination_limit" };
}

function publicDestinations(app) {
  return app.destinations?.length
    ? app.destinations
        .filter((item) => item.type === "public")
        .map((item) => item.uri)
    : app.self_hosted_domains?.length
      ? app.self_hosted_domains
      : [app.domain].filter(Boolean);
}

function coversEditor(destination) {
  if (typeof destination !== "string") return false;
  const host = destination.replace(/^https?:\/\//, "").split("/")[0];
  const pattern = host
    .split("*")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${pattern}$`, "i").test("edit.leer.education");
}

const domains = await get("/workers/domains");
if (domains.available)
  console.log(
    JSON.stringify({
      check: "custom_domains",
      mappings: domains.result
        .filter((item) =>
          [
            "leer.education",
            "www.leer.education",
            "edit.leer.education",
          ].includes(item.hostname),
        )
        .map((item) => ({
          hostname: item.hostname,
          service: item.service,
          environment: item.environment,
        })),
    }),
  );
else console.log(JSON.stringify({ check: "custom_domains", ...domains }));

const workers = await get("/workers/scripts");
if (workers.available)
  console.log(
    JSON.stringify({
      check: "workers",
      names: workers.result
        .map((item) => item.id)
        .filter((name) =>
          [
            "leer-preview",
            "leer-editing",
            "leer-production",
            "astro-website-dummy-20260912",
          ].includes(name),
        ),
    }),
  );
else console.log(JSON.stringify({ check: "workers", ...workers }));

console.log(
  "This audit makes no configuration changes and prints no credentials.",
);

const organization = await get("/access/organizations");
console.log(
  JSON.stringify(
    organization.available
      ? {
          check: "access_organization",
          teamDomain: organization.result.auth_domain,
        }
      : { check: "access_organization", ...organization },
  ),
);

const applications = await list("/access/apps");
if (applications.available) {
  const selected = applications.result.filter((app) =>
    publicDestinations(app).some(coversEditor),
  );
  for (const app of selected) {
    const policies = await list(`/access/apps/${app.id}/policies`);
    console.log(
      JSON.stringify({
        check: "access_application",
        id: app.id,
        destinations: publicDestinations(app).filter(coversEditor),
        destinationCount: publicDestinations(app).length,
        type: app.type,
        aud: app.aud,
        sessionDuration: app.session_duration,
        allowedIdps: app.allowed_idps,
        warpAuthentication: app.allow_authenticate_via_warp === true,
        preflightBypass: app.options_preflight_bypass === true,
        policies: policies.available
          ? policies.result.map((policy) => ({
              decision: policy.decision,
              includeRules: policy.include?.length,
              requires: policy.require?.length,
              excludes: policy.exclude?.length,
              onlySelectedEditor:
                policy.include?.length === 1 &&
                policy.include[0]?.email?.email === "admin@leer.education",
            }))
          : policies,
      }),
    );
  }
  console.log(
    JSON.stringify({
      check: "access_applications",
      total: applications.result.length,
      matched: selected.length,
    }),
  );
} else
  console.log(
    JSON.stringify({ check: "access_applications", ...applications }),
  );

const providers = await list("/access/identity_providers");
console.log(
  JSON.stringify(
    providers.available
      ? {
          check: "access_login",
          oneTimePin: providers.result
            .filter((provider) => provider.type === "onetimepin")
            .map((provider) => ({ id: provider.id, type: provider.type })),
        }
      : { check: "access_login", ...providers },
  ),
);

const zones = await get(`?name=leer.education&account.id=${account}`, "zones");
if (zones.available && zones.result.length === 1) {
  const scope = `zones/${zones.result[0].id}`;
  const routes = await get("/workers/routes", scope);
  console.log(
    JSON.stringify(
      routes.available
        ? {
            check: "zone_worker_routes",
            routes: routes.result.map(({ pattern, script }) => ({
              pattern,
              script,
            })),
          }
        : { check: "zone_worker_routes", ...routes },
    ),
  );
  const dns = await get("/dns_records?name=edit.leer.education", scope);
  console.log(
    JSON.stringify(
      dns.available
        ? {
            check: "editing_dns",
            records: dns.result.map(({ name, type, proxied }) => ({
              name,
              type,
              proxied,
            })),
          }
        : { check: "editing_dns", ...dns },
    ),
  );
} else console.log(JSON.stringify({ check: "zone_lookup", available: false }));

console.log(
  "Competing build integrations and public redirect rules still require separate verification.",
);
if (!domains.available || !workers.available) process.exitCode = 1;
