import type { APIRoute } from "astro";
import {
  experimental_createIslandRoute,
  type IslandRegistry,
} from "@tinacms/astro/experimental";
import ProofPage from "./ProofPage.astro";
import ProofHeader from "./ProofHeader.astro";
import ProofFooter from "./ProofFooter.astro";
import { loadProofPage, loadProofGlobal } from "./loaders";
import { validateContent, validateRefresh } from "./refresh-validation";

function props(
  data: unknown,
  document: string,
  prop: string,
): Record<string, unknown> {
  if (
    !data ||
    typeof data !== "object" ||
    !("data" in data) ||
    !data.data ||
    typeof data.data !== "object" ||
    !(document in data.data)
  )
    throw new Error("Missing proof document.");
  const value = (data.data as Record<string, unknown>)[document];
  validateContent(value);
  return { [prop]: value };
}

const regions = {
  page: {
    fetch: loadProofPage,
    component: ProofPage,
    wrapper: { tag: "article" },
    propsFromData: (data: unknown) => props(data, "proofPage", "page"),
  },
  header: {
    fetch: loadProofGlobal,
    component: ProofHeader,
    wrapper: { tag: "header", className: "page-width site-header" },
    propsFromData: (data: unknown) => props(data, "proofGlobal", "global"),
  },
  footer: {
    fetch: loadProofGlobal,
    component: ProofFooter,
    wrapper: { tag: "footer", className: "page-width site-footer" },
    propsFromData: (data: unknown) => props(data, "proofGlobal", "global"),
  },
} satisfies IslandRegistry;

const render = experimental_createIslandRoute(regions);
export const prerender = false;
export const ALL: APIRoute = async (context) => {
  const rejection = await validateRefresh(context.request, context.params.name);
  if (rejection) return rejection;
  return render(context);
};
