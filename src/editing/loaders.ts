import { requestWithMetadata } from "@tinacms/astro";
import { validateContent } from "./refresh-validation";
import { createClient } from "tinacms/dist/client";
import { env } from "cloudflare:workers";
import { queries } from "../../tina/__generated__/types";

function contentClient() {
  const local = import.meta.env.TINA_LOCAL_PROOF;
  if (!local && !env.TINA_TOKEN)
    throw new Error("The hosted content connection is not configured.");
  return createClient({
    url: local
      ? "http://127.0.0.1:4001/graphql"
      : import.meta.env.TINA_CONTENT_API,
    token: local ? undefined : env.TINA_TOKEN,
    queries,
  });
}

export async function loadProofPage() {
  const response = await contentClient().queries.proofPage({
    relativePath: "proof.md",
  });
  const result = await requestWithMetadata(response, { priority: "primary" });
  validateContent(result.data);
  return result;
}

export async function loadProofGlobal() {
  const response = await contentClient().queries.proofGlobal({
    relativePath: "site.md",
  });
  const result = await requestWithMetadata(response);
  validateContent(result.data);
  return result;
}
