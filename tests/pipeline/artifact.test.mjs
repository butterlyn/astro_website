import assert from "node:assert/strict";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  artifactDigest,
  prepareArtifact,
  verifyArtifact,
} from "../../scripts/build-artifact.mjs";
import { buildTarget } from "../../scripts/build-target.mjs";

test("packaging removes adapter secret files and rejects embedded token values", async () => {
  const directory = await mkdtemp(join(tmpdir(), "leer-artifact-secret-"));
  const token = "a-non-secret-regression-canary";
  try {
    await mkdir(join(directory, "server"));
    await writeFile(join(directory, "server/.dev.vars"), `TINA_TOKEN=${token}`);
    await writeFile(join(directory, "server/worker.js"), "Worker bytes");
    await prepareArtifact(directory, [token]);
    await assert.rejects(readFile(join(directory, "server/.dev.vars")), {
      code: "ENOENT",
    });
    await writeFile(join(directory, "server/worker.js"), token);
    await assert.rejects(
      prepareArtifact(directory, [token]),
      /Secret value present/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("build targets require explicit branch choices and exclude live CMS production reads", () => {
  assert.deepEqual(
    buildTarget({ BUILD_TARGET: "production", CONTENT_BRANCH: "main" }),
    { target: "production", branch: "main" },
  );
  assert.deepEqual(
    buildTarget({
      BUILD_TARGET: "editing",
      CONTENT_BRANCH: "development",
      TINA_BRANCH: "development",
    }),
    { target: "editing", branch: "development" },
  );
  for (const env of [
    {},
    { BUILD_TARGET: "typo" },
    { BUILD_TARGET: "editing", CONTENT_BRANCH: "development" },
    {
      BUILD_TARGET: "editing",
      CONTENT_BRANCH: "main",
      TINA_BRANCH: "development",
    },
    {
      BUILD_TARGET: "production",
      CONTENT_BRANCH: "main",
      TINA_BRANCH: "development",
    },
  ])
    assert.throws(() => buildTarget(env));
});

test("editing artifacts reject local bypass mode and mismatched public identities", async () => {
  const directory = await mkdtemp(join(tmpdir(), "leer-editing-artifact-"));
  try {
    await mkdir(join(directory, "client"));
    await writeFile(join(directory, "worker.js"), "Worker bytes");
    const identity = {
      commit: "a".repeat(40),
      target: "editing",
      branch: "development",
      dirty: false,
      backend: "local",
      digest: await artifactDigest(directory),
    };
    await writeFile(join(directory, "build.json"), JSON.stringify(identity));
    await assert.rejects(
      verifyArtifact(directory, identity),
      /local editing proof/,
    );
    identity.backend = "cloud";
    await writeFile(join(directory, "build.json"), JSON.stringify(identity));
    await writeFile(
      join(directory, "client/build.json"),
      JSON.stringify({ ...identity, commit: "b".repeat(40) }),
    );
    await assert.rejects(
      verifyArtifact(directory, identity),
      /public build identity/,
    );
    await writeFile(
      join(directory, "client/build.json"),
      JSON.stringify(identity),
    );
    await verifyArtifact(directory, identity);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("artifact verification detects wrong revision/target, dirty builds and modified bytes", async () => {
  const directory = await mkdtemp(join(tmpdir(), "leer-artifact-"));
  try {
    await writeFile(join(directory, "index.html"), "Reviewed bytes");
    const identity = {
      commit: "a".repeat(40),
      target: "production",
      branch: "main",
      dirty: false,
      digest: await artifactDigest(directory),
    };
    await writeFile(join(directory, "build.json"), JSON.stringify(identity));
    await verifyArtifact(directory, identity);
    await assert.rejects(
      verifyArtifact(directory, { ...identity, commit: "b".repeat(40) }),
    );
    await assert.rejects(
      verifyArtifact(directory, { ...identity, target: "editing" }),
    );
    await writeFile(
      join(directory, "build.json"),
      JSON.stringify({ ...identity, dirty: true }),
    );
    await assert.rejects(verifyArtifact(directory, identity), /uncommitted/);
    await writeFile(join(directory, "build.json"), JSON.stringify(identity));
    await writeFile(join(directory, "index.html"), "Unreviewed bytes");
    await assert.rejects(verifyArtifact(directory, identity), /bytes changed/);
    await symlink(join(directory, "index.html"), join(directory, "alias.html"));
    await assert.rejects(artifactDigest(directory), /symlink/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
