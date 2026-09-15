export const maximumOverlayBytes = 128 * 1024;
export const previewContentType = "application/x-tina-preview+json";
const supportedNodes = new Set([
  "root",
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "lic",
  "blockquote",
  "a",
  "img",
  "code_block",
  "hr",
  "break",
  "text",
]);

export function validateContent(
  value: unknown,
  depth = 0,
  metadata = false,
): void {
  if (depth > 40) throw new Error("Content is nested too deeply.");
  if (Array.isArray(value)) {
    if (value.length > 200) throw new Error("Content has too many items.");
    for (const item of value) validateContent(item, depth + 1, metadata);
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (["__proto__", "constructor", "prototype"].includes(key))
        throw new Error("Unsupported content key.");
      if (
        !metadata &&
        key === "type" &&
        typeof child === "string" &&
        !supportedNodes.has(child)
      )
        throw new Error(
          "Unsupported rich text. Raw HTML and embedded components are not enabled.",
        );
      if (
        !metadata &&
        ["href", "url", "image", "src"].includes(key) &&
        typeof child === "string" &&
        child
      ) {
        if (
          Array.from(child).some(
            (character) => character.charCodeAt(0) <= 32 || character === "\\",
          ) ||
          child.startsWith("//") ||
          !/^(\/(?!\/)|#|https:\/\/|mailto:|tel:)/.test(child)
        )
          throw new Error("Unsupported content URL.");
      }
      // Tina's field metadata includes names such as `image: "image"` and
      // `href: "sections.0.items.0.link.href"`; these are paths, not URLs.
      validateContent(
        child,
        depth + 1,
        metadata || ["_tina_metadata", "_content_source"].includes(key),
      );
    }
  }
}

export async function validateRefresh(
  request: Request,
  region: string | undefined,
): Promise<Response | undefined> {
  const fail = (status: number, message: string) =>
    new Response(message, {
      status,
      headers: { "Cache-Control": "private, no-store" },
    });
  if (request.method !== "POST") return fail(405, "Use POST.");
  if (!["page", "header", "footer"].includes(region ?? ""))
    return fail(404, "Unknown editing region.");
  const url = new URL(request.url);
  if (url.search) return fail(400, "This proof has no region parameters.");
  if (
    request.headers.get("origin") !== url.origin ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return fail(403, "Same-origin requests only.");
  if (
    request.headers.get("content-type")?.split(";")[0]?.trim() !==
    previewContentType
  )
    return fail(415, "Unsupported content type.");
  const declared = request.headers.get("content-length");
  if (
    declared &&
    (!/^\d+$/.test(declared) || Number(declared) > maximumOverlayBytes)
  )
    return fail(413, "Overlay exceeds the size limit.");
  const reader = request.clone().body?.getReader();
  if (!reader) return fail(400, "An overlay object is required.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximumOverlayBytes) {
        // A tee's cancellation promise waits for the other branch. Do not
        // await it here; the original request is discarded by the caller.
        void reader.cancel().catch(() => {});
        return fail(413, "Overlay exceeds the size limit.");
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    const overlay: unknown = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    );
    if (
      !overlay ||
      typeof overlay !== "object" ||
      Array.isArray(overlay) ||
      Object.keys(overlay).length > 3
    )
      return fail(400, "Invalid overlay envelope.");
    validateContent(overlay);
  } catch {
    return fail(400, "Invalid or unsupported editing content.");
  } finally {
    reader.releaseLock();
  }
  return undefined;
}
