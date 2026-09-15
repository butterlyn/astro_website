import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const client = process.env.TINA_PUBLIC_CLIENT_ID;
const token = process.env.TINA_TOKEN;
assert.match(client ?? "", /^[a-f0-9-]{36}$/);
assert.ok(token, "A development content token is required.");
assert.equal(process.env.TINA_BRANCH, "development");
const { version } = JSON.parse(
  await readFile("tina/__generated__/_schema.json", "utf8"),
);
assert.match(String(version.major), /^\d+$/);
assert.match(String(version.minor), /^\d+$/);
const response = await fetch(
  `https://content.tinajs.io/${version.major}.${version.minor}/content/${client}/github/development`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-KEY": token },
    body: JSON.stringify({
      query:
        '{ proofPage(relativePath: "proof.md") { title } proofGlobal(relativePath: "site.md") { name } }',
    }),
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  },
);
if (!response.ok) {
  await response.body?.cancel();
  throw new Error(
    `TinaCloud development content read failed (HTTP ${response.status}).`,
  );
}
const result = await response.json();
assert.ok(
  !result.errors?.length,
  "TinaCloud could not query the committed proof schema/documents; inspect project indexing.",
);
assert.equal(typeof result.data?.proofPage?.title, "string");
assert.equal(typeof result.data?.proofGlobal?.name, "string");
console.log(
  "TinaCloud authenticated development reads succeeded for the page and shared content fixtures.",
);
