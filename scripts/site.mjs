import { spawnSync } from "node:child_process";
import { rm } from "node:fs/promises";
import { buildTarget } from "./build-target.mjs";

const [command, target, mode] = process.argv.slice(2);
if (
  !["build", "dev", "check", "schema"].includes(command) ||
  !["production", "editing"].includes(target)
)
  throw new Error(
    "Usage: node scripts/site.mjs build|dev|check|schema production|editing [local|cloud]",
  );
if (target === "editing" && !["local", "cloud"].includes(mode))
  throw new Error("Select local or cloud Tina mode explicitly.");
const env = { ...process.env, BUILD_TARGET: target };
env.CONTENT_BRANCH ??= target === "production" ? "main" : "development";
if (target === "editing") {
  env.TINA_BRANCH ??= "development";
  env.TINA_PUBLIC_IS_LOCAL = mode === "local" ? "true" : "false";
}
buildTarget(env);
function run(executable, args) {
  // Tina CLI can print configuration values on authentication failures.
  const sensitive = [env.TINA_TOKEN].filter(Boolean);
  const result = spawnSync(executable, args, {
    env,
    stdio: sensitive.length ? ["ignore", "pipe", "pipe"] : "inherit",
    maxBuffer: 32 * 1024 * 1024,
  });
  if (sensitive.length) {
    for (const output of [result.stdout, result.stderr]) {
      let message = output?.toString() ?? "";
      for (const secret of sensitive)
        message = message.split(secret).join("[REDACTED]");
      process.stdout.write(message);
    }
  }
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
const astro = "node_modules/.bin/astro";
const tina = "node_modules/.bin/tinacms";
if (command === "check") {
  run(astro, ["check"]);
  run("node_modules/.bin/tsc", ["--noEmit"]);
} else {
  await rm(`dist/${target}`, { recursive: true, force: true });
  run(process.execPath, ["scripts/prepare-assets.mjs"]);
  if (command === "schema") {
    if (target !== "editing" || mode !== "local")
      throw new Error("Schema generation uses the local editing target.");
    run(tina, ["dev", "--no-server", "--noWatch", "--noTelemetry"]);
  } else if (target === "editing") {
    if (command === "dev") {
      if (mode !== "local")
        throw new Error("Use the protected deployment for hosted editing.");
      run(tina, [
        "build",
        "--local",
        "--skip-cloud-checks",
        "--skip-search-index",
        "--noTelemetry",
        "-c",
        "node scripts/preview-editing.mjs",
      ]);
    } else {
      run(tina, [
        "build",
        "--noTelemetry",
        "--skip-search-index",
        ...(mode === "local"
          ? ["--local", "--skip-cloud-checks"]
          : ["--content=local"]),
        "-c",
        `${astro} build`,
      ]);
      if (mode === "cloud")
        run(process.execPath, ["scripts/check-tinacloud.mjs"]);
      run(process.execPath, ["scripts/build-artifact.mjs"]);
    }
  } else {
    if (command === "dev") run(process.execPath, ["scripts/dev-server.mjs"]);
    else run(astro, [command]);
    if (command === "build")
      run(process.execPath, ["scripts/build-artifact.mjs"]);
  }
}
