import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { buildTarget } from "./build-target.mjs";

export async function prepareArtifact(directory, secrets = []) {
  async function visit(relative) {
    for (const entry of await readdir(join(directory, relative), {
      withFileTypes: true,
    })) {
      const path = join(relative, entry.name);
      if (entry.isSymbolicLink())
        throw new Error(`Artifact contains a symlink: ${path}`);
      if (entry.isDirectory()) await visit(path);
      else if (!entry.isFile())
        throw new Error(`Unsupported artifact entry: ${path}`);
      else if (/^\.(dev\.vars|env)(\.|$)/.test(entry.name)) {
        // The Cloudflare adapter copies build secrets for local preview.
        // Cloud deployment receives runtime secrets separately, never in files.
        await rm(join(directory, path));
      } else if (secrets.length) {
        const bytes = await readFile(join(directory, path));
        if (secrets.some((secret) => secret && bytes.includes(secret)))
          throw new Error(`Secret value present in artifact: ${path}`);
      }
    }
  }
  await visit("");
}

export async function artifactDigest(directory) {
  const hash = createHash("sha256");
  async function visit(relative) {
    const entries = await readdir(join(directory, relative), {
      withFileTypes: true,
    });
    for (const entry of entries.sort((a, b) =>
      a.name.localeCompare(b.name, "en"),
    )) {
      const path = relative ? `${relative}/${entry.name}` : entry.name;
      if (path === "build.json" || path === "client/build.json") continue;
      if (entry.isSymbolicLink())
        throw new Error(`Artifact contains a symlink: ${path}`);
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile()) {
        const bytes = await readFile(join(directory, path));
        hash.update(`${Buffer.byteLength(path)}:${path}:${bytes.length}:`);
        hash.update(bytes);
      } else throw new Error(`Unsupported artifact entry: ${path}`);
    }
  }
  await visit("");
  return hash.digest("hex");
}

export async function verifyArtifact(directory, expected) {
  const identity = JSON.parse(
    await readFile(join(directory, "build.json"), "utf8"),
  );
  for (const field of ["commit", "target", "branch"])
    if (identity[field] !== expected[field])
      throw new Error(
        `Artifact ${field} does not match the tested revision/target.`,
      );
  if (identity.dirty !== false)
    throw new Error("An uncommitted build is not deployable.");
  if (identity.target === "editing" && identity.backend !== "cloud")
    throw new Error("A local editing proof is not deployable.");
  if (identity.target === "editing") {
    const publicIdentity = JSON.parse(
      await readFile(join(directory, "client/build.json"), "utf8"),
    );
    if (JSON.stringify(publicIdentity) !== JSON.stringify(identity))
      throw new Error(
        "The public build identity differs from the artifact identity.",
      );
  }
  if (identity.digest !== (await artifactDigest(directory)))
    throw new Error("Artifact bytes changed after stamping.");
  return identity;
}

export async function stampArtifact(directory, env = process.env) {
  const { target, branch } = buildTarget(env);
  await prepareArtifact(directory, [env.TINA_TOKEN].filter(Boolean));
  const commit = execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  if (env.GITHUB_SHA && env.GITHUB_SHA !== commit)
    throw new Error("Checkout differs from the requested Actions revision.");
  const dirty =
    execFileSync("git", ["status", "--porcelain", "--untracked-files=normal"], {
      encoding: "utf8",
    }).trim() !== "";
  const identity = {
    commit,
    target,
    branch,
    dirty,
    backend:
      target === "production"
        ? "snapshot"
        : env.TINA_PUBLIC_IS_LOCAL === "true"
          ? "local"
          : "cloud",
    digest: await artifactDigest(directory),
  };
  await writeFile(
    join(directory, "build.json"),
    `${JSON.stringify(identity)}\n`,
  );
  if (target === "editing")
    await writeFile(
      join(directory, "client/build.json"),
      `${JSON.stringify(identity)}\n`,
    );
  console.log(
    `Stamped ${target} artifact at ${commit}${dirty ? " (local uncommitted changes; not deployable)" : ""}.`,
  );
  return identity;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const { target } = buildTarget(process.env);
  await stampArtifact(
    target === "production" ? "dist/production" : "dist/editing",
  );
}
