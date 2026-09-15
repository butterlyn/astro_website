import { build } from "esbuild";
import { spawnSync } from "node:child_process";

// Tina's browser package has CJS dependencies with named ESM imports. Bundle
// the unmodified exported APIs as the admin does, rather than patching them.
await build({
  entryPoints: ["tests/feasibility/tina.test.mjs"],
  outfile: ".build/tests/tina.test.cjs",
  bundle: true,
  platform: "node",
  format: "cjs",
  logLevel: "warning",
});
const result = spawnSync(
  process.execPath,
  ["--test", ".build/tests/tina.test.cjs"],
  { stdio: "inherit" },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
