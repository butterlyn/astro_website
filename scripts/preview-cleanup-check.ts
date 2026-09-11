import { previewWorker } from "./preview-guard.ts";

const account = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
if (!account || !/^[a-f0-9]{32}$/i.test(account) || !token) {
  throw new Error(
    "Set the existing Cloudflare account and token repository secrets.",
  );
}
let response: Response;
try {
  response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${previewWorker}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      redirect: "error",
      signal: AbortSignal.timeout(30_000),
    },
  );
} catch {
  throw new Error(
    "Could not confirm deletion. Check Cloudflare connectivity and retry cleanup.",
  );
}
if (response.status !== 404) {
  throw new Error(
    `Worker absence is not confirmed (HTTP ${response.status}). Check deletion permissions and retry cleanup.`,
  );
}
console.log(`PASS: Cloudflare confirms ${previewWorker} is absent (HTTP 404).`);
