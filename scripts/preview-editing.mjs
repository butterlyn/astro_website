import { build, preview } from "astro";

// Exercise the built Cloudflare Worker with Tina's live local content API.
// The pinned adapter's dev dependency optimizer fails during DO discovery.
// Restart after changing Astro components or the schema; content saves are live.
await build({});
const server = await preview({
  server: {
    host: "127.0.0.1",
    port: 4321,
    allowedHosts: ["edit.leer.education"],
  },
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, async () => {
    await server.stop();
    process.exit(0);
  });
