import { cp, mkdir, rm, stat, writeFile } from "node:fs/promises";
import { buildTarget } from "./build-target.mjs";

const { target } = buildTarget(process.env);
const directory = `.build/public-${target}`;
await rm(directory, { recursive: true, force: true });
await mkdir(directory, { recursive: true });
// Explicit prototype allowlist: generated admin, Markdown and unreviewed
// uploads under public/ cannot accidentally enter the public artifact.
for (const asset of ["favicon.svg", "robots.txt", "_headers"])
  await cp(`public/${asset}`, `${directory}/${asset}`);
if (target === "editing") {
  const uploads = await stat("public/uploads").catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
  if (uploads?.isDirectory())
    await cp("public/uploads", `${directory}/uploads`, { recursive: true });
  await writeFile(
    `${directory}/_headers`,
    "/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  X-Content-Type-Options: nosniff\n  Cache-Control: private, no-store\n  Referrer-Policy: same-origin\n",
  );
}
