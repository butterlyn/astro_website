import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const forbiddenPath =
  /(^|\/)(admin|edit|tina-island|editing-proof|editing-reservation|content|uploads)(\/|$)|\.mdx?$|\.map$/;
const forbiddenHTML = /data-tina-|\/admin\/|tina-island|Agentation/;
async function inspect(directory, relative = "") {
  for (const entry of await readdir(join(directory, relative), {
    withFileTypes: true,
  })) {
    const name = relative ? `${relative}/${entry.name}` : entry.name;
    if (forbiddenPath.test(name))
      throw new Error(`Private or unapproved asset in production: ${name}`);
    if (entry.isDirectory()) await inspect(directory, name);
    else if (name.endsWith(".html")) {
      const html = await readFile(join(directory, name), "utf8");
      if (forbiddenHTML.test(html))
        throw new Error(`Editor code or markers in production: ${name}`);
      if (!html.includes("noindex"))
        throw new Error(`Prototype is missing noindex: ${name}`);
    }
  }
}
await inspect("dist/production");
console.log(
  "Production contains no editing routes, markers, raw Markdown or unapproved uploads.",
);
