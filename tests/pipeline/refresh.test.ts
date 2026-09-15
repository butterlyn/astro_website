import assert from "node:assert/strict";
import test from "node:test";
import {
  maximumOverlayBytes,
  previewContentType,
  validateRefresh,
} from "../../src/editing/refresh-validation.ts";

function request(body = "{}", headers: Record<string, string> = {}) {
  return new Request("http://localhost:4321/tina-island/page", {
    method: "POST",
    headers: {
      origin: "http://localhost:4321",
      "content-type": previewContentType,
      ...headers,
    },
    body,
  });
}

test("valid same-origin overlays remain readable by Tina after validation", async () => {
  const source = JSON.stringify({
    form: {
      proofPage: {
        title: "Unsaved",
        image: "/favicon.svg",
        _tina_metadata: {
          fields: { image: "image", href: "sections.0.items.0.link.href" },
        },
        body: {
          type: "root",
          children: [{ type: "p", children: [{ text: "Some text" }] }],
        },
      },
    },
  });
  const req = request(source);
  assert.equal(await validateRefresh(req, "page"), undefined);
  assert.equal(await req.text(), source);
});

test("refresh rejects unknown regions, foreign origins and incorrect media types", async () => {
  assert.equal((await validateRefresh(request(), "constructor"))?.status, 404);
  assert.equal(
    (
      await validateRefresh(
        request("{}", { origin: "https://attacker.example" }),
        "page",
      )
    )?.status,
    403,
  );
  assert.equal(
    (
      await validateRefresh(
        request("{}", { "sec-fetch-site": "cross-site" }),
        "page",
      )
    )?.status,
    403,
  );
  assert.equal(
    (
      await validateRefresh(
        request("{}", { "content-type": "application/json" }),
        "page",
      )
    )?.status,
    415,
  );
  assert.equal(
    (
      await validateRefresh(
        new Request("http://localhost:4321/tina-island/page"),
        "page",
      )
    )?.status,
    405,
  );
});

test("refresh enforces actual streamed bytes even without Content-Length", async () => {
  const rejection = await validateRefresh(
    request("x".repeat(maximumOverlayBytes + 1)),
    "page",
  );
  assert.equal(rejection?.status, 413);
  assert.equal(rejection?.headers.get("cache-control"), "private, no-store");
  assert.equal(
    (
      await validateRefresh(
        request("{}", { "content-length": String(maximumOverlayBytes + 1) }),
        "page",
      )
    )?.status,
    413,
  );
});

test("unsupported raw HTML, embedded components, URLs, poison keys and malformed JSON fail", async () => {
  for (const source of [
    '{"q":{"type":"html","value":"<script>alert(1)</script>"}}',
    '{"q":{"type":"mdxJsxFlowElement","name":"script"}}',
    '{"q":{"href":"javascript:alert(1)"}}',
    '{"q":{"src":"//other.example/image.png"}}',
    '{"q":{"image":"data:image/svg+xml,<svg/>"}}',
    '{"q":{"href":"/\\\\other.example"}}',
    '{"q":{"__proto__":{"title":"bad"}}}',
    "null",
    "[]",
    "{",
  ])
    assert.equal(
      (await validateRefresh(request(source), "page"))?.status,
      400,
      source,
    );
});
