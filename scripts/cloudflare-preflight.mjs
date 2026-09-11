// Read-only checks; Cloudflare writes remain in the deployment workflow.
import { pathToFileURL } from "node:url";

class PreflightError extends Error {}

export async function runPreflight({
  env = process.env,
  fetchImpl = globalThis.fetch,
  log = console.log,
} = {}) {
  const accountId = env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const token = env.CLOUDFLARE_API_TOKEN?.trim();

  if (!accountId || !token) {
    throw new PreflightError(
      "Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN as repository secrets. Local execution requires the same environment variables.",
    );
  }
  if (!/^[a-f0-9]{32}$/i.test(accountId)) {
    throw new PreflightError(
      "CLOUDFLARE_ACCOUNT_ID must be the 32-character hexadecimal account ID from the Cloudflare dashboard.",
    );
  }

  async function get(resource) {
    let response;
    try {
      response = await fetchImpl(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/${resource}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          redirect: "error",
          signal: AbortSignal.timeout(15_000),
        },
      );
    } catch {
      throw new PreflightError(
        `Cloudflare ${resource} request failed or timed out. Check network access and retry; no credentials or response bodies are logged.`,
      );
    }

    if (!response.ok) {
      const fix =
        response.status === 401 || response.status === 403
          ? "Check the token's validity and access to the account in CLOUDFLARE_ACCOUNT_ID. Update the repository secrets if needed."
          : resource === "subdomain" && response.status === 404
            ? "Configure a workers.dev subdomain in the Cloudflare dashboard under Workers & Pages."
            : "Check Cloudflare service status and the account's Workers setup, then retry.";
      throw new PreflightError(
        `Cloudflare ${resource} check returned HTTP ${response.status}. ${fix}`,
      );
    }

    let data;
    try {
      data = await response.json();
    } catch {
      throw new PreflightError(
        `Cloudflare ${resource} check returned invalid JSON. Retry after checking Cloudflare service status.`,
      );
    }
    if (data?.success !== true) {
      throw new PreflightError(
        `Cloudflare ${resource} check was unsuccessful. Check the account, token permissions, and Workers setup in the dashboard.`,
      );
    }
    return data.result;
  }

  const workers = await get("scripts");
  if (!Array.isArray(workers)) {
    throw new PreflightError("Cloudflare returned an unexpected Workers list.");
  }
  log("PASS: the supplied token can read Workers in the supplied account.");

  const result = await get("subdomain");
  if (typeof result?.subdomain !== "string" || !result.subdomain.trim()) {
    throw new PreflightError(
      "No workers.dev subdomain is configured. Create one in the Cloudflare dashboard under Workers & Pages before running the dummy-site prompt.",
    );
  }
  log("PASS: a workers.dev subdomain is configured.");
  log(
    "Deployment and deletion permissions still require the dummy deployment and its later cleanup. Check separately that Workers Builds is disconnected.",
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    await runPreflight();
  } catch (error) {
    // Never print arbitrary API responses or native errors containing secrets.
    console.error(
      error instanceof PreflightError
        ? error.message
        : "Unexpected preflight failure; details suppressed to protect credentials.",
    );
    process.exitCode = 1;
  }
}
