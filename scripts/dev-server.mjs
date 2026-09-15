import { dev } from "astro";

// Keep Astro in this process so Tina and Playwright share its lifecycle.
// The Astro CLI otherwise detaches automatically in an agent environment.
const server = await dev({ server: { host: "127.0.0.1", port: 4321 } });
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, async () => {
    await server.stop();
    process.exit(0);
  });
