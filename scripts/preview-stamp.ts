import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const commit =
  process.env.GITHUB_SHA ||
  execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (!/^[a-f0-9]{40}$/.test(commit))
  throw new Error("A full commit SHA is required for build provenance.");
writeFileSync("dist/build.json", `${JSON.stringify({ commit })}\n`);
console.log(`Stamped static artifact with commit ${commit}.`);
