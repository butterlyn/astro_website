// Read-only topology audit using GitHub-held secrets. Do not print complete
// API responses, account IDs, tokens, Access identities or unrelated domains.
const account = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
if (!account || !/^[a-f0-9]{32}$/i.test(account) || !token)
  throw new Error("Cloudflare account/token configuration is missing.");

async function get(path) {
  try {
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
      return { available: false, status: response.status };
    }
    const data = await response.json();
    if (data.success !== true || !Array.isArray(data.result))
      return { available: false, status: "invalid_response" };
    return { available: true, result: data.result };
  } catch {
    return { available: false, status: "request_failed" };
  }
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
  "Zone routes/redirects, Access coverage and competing build integrations still require separate verification. This audit makes no configuration changes.",
);
if (!domains.available || !workers.available) process.exitCode = 1;
