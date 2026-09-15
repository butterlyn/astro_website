// @ts-check
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { buildTarget } from "./scripts/build-target.mjs";

const { target } = buildTarget(process.env);
const editing = target === "editing";
/** @type {import("astro").AstroIntegration[]} */
const integrations = [];
let adapter;
let contentApi = "";
if (editing) {
  const { version } = JSON.parse(
    readFileSync(
      new URL("./tina/__generated__/_schema.json", import.meta.url),
      "utf8",
    ),
  );
  contentApi = `https://content.tinajs.io/${version.major}.${version.minor}/content/${encodeURIComponent(process.env.TINA_PUBLIC_CLIENT_ID ?? "")}/github/development`;
  const [{ default: cloudflare }, { default: tina }] = await Promise.all([
    import("@astrojs/cloudflare"),
    import("@tinacms/astro/integration"),
  ]);
  adapter = cloudflare({
    configPath: "wrangler.editing.jsonc",
    imageService: "passthrough",
    remoteBindings: false,
  });
  integrations.push(tina(), {
    name: "leer-editing-proof",
    hooks: {
      "astro:config:setup": ({ injectRoute, addMiddleware }) => {
        injectRoute({
          pattern: "/edit/",
          entrypoint: fileURLToPath(
            new URL("./src/editing/Edit.astro", import.meta.url),
          ),
          prerender: false,
        });
        injectRoute({
          pattern: "/editing-proof/",
          entrypoint: fileURLToPath(
            new URL("./src/editing/Proof.astro", import.meta.url),
          ),
          prerender: false,
        });
        injectRoute({
          pattern: "/tina-island/[name]",
          entrypoint: fileURLToPath(
            new URL("./src/editing/refresh.ts", import.meta.url),
          ),
          prerender: false,
        });
        addMiddleware({
          entrypoint: fileURLToPath(
            new URL("./src/editing/middleware.ts", import.meta.url),
          ),
          order: "pre",
        });
      },
    },
  });
}

export default defineConfig({
  output: "static",
  site: editing ? "https://edit.leer.education" : "https://leer.education",
  outDir: `./dist/${target}`,
  publicDir: `./.build/public-${target}`,
  session: false,
  adapter,
  integrations,
  trailingSlash: "always",
  vite: {
    cacheDir: `.astro/vite-${target}`,
    plugins: [tailwindcss()],
    define: {
      "import.meta.env.TINA_LOCAL_PROOF": JSON.stringify(
        process.env.TINA_PUBLIC_IS_LOCAL === "true",
      ),
      "import.meta.env.TINA_CONTENT_API": JSON.stringify(contentApi),
    },
  },
});
