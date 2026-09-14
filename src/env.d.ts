/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly TINA_LOCAL_PROOF: boolean;
  readonly TINA_CONTENT_API: string;
}

// Astro check validates component props. Plain tsc only needs the compiled
// server factory type for the registered HTML refresh components.
declare module "*.astro" {
  const component: import("astro/runtime/server/index.js").AstroComponentFactory;
  export default component;
}
