import { spawnSync } from "node:child_process";
import { mkdir } from "node:fs/promises";

// Wrangler writes the output file but does not create its parent directory.
await mkdir(".wrangler", { recursive: true });
const result = spawnSync(
  "node_modules/.bin/wrangler",
  [
    "types",
    "--config",
    "wrangler.editing.jsonc",
    ".wrangler/worker-configuration.d.ts",
  ],
  { stdio: "inherit" },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
