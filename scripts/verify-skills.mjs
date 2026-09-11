import { createHash } from "node:crypto";
import { readdir, readFile, readlink, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const lock = JSON.parse(
  await readFile(path.join(root, "skills-lock.json"), "utf8"),
);

async function collectFiles(base, directory = base) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory() && ![".git", "node_modules"].includes(entry.name)) {
      files.push(...(await collectFiles(base, filename)));
    } else if (entry.isFile()) {
      files.push({
        relativePath: path.relative(base, filename).split(path.sep).join("/"),
        content: await readFile(filename),
      });
    }
  }
  return files;
}

for (const [name, entry] of Object.entries(lock.skills)) {
  try {
    const directory = path.join(root, ".agents/skills", name);
    const files = await collectFiles(directory);
    files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
    const hash = createHash("sha256");
    for (const file of files)
      hash.update(file.relativePath).update(file.content);
    if (hash.digest("hex") !== entry.computedHash) {
      throw new Error("files differ from skills-lock.json");
    }
    const mirror = path.join(root, ".claude/skills", name);
    const target = await readlink(mirror);
    if (path.resolve(path.dirname(mirror), target) !== directory) {
      throw new Error("Claude skill symlink points elsewhere");
    }
    if (!(await stat(path.join(mirror, "SKILL.md"))).isFile()) {
      throw new Error("Claude skill symlink is broken");
    }
    console.log(`PASS: ${name} hash and Claude symlink`);
  } catch (error) {
    console.error(`FAIL: ${name}: ${error.message}`);
    process.exitCode = 1;
  }
}
