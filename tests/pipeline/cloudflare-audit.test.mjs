import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

const script = new URL("../../scripts/cloudflare-audit.mjs", import.meta.url);
const account = "a".repeat(32);

function audit(responses) {
  const output = execFileSync(process.execPath, ["--input-type=module"], {
    encoding: "utf8",
    env: {
      CLOUDFLARE_ACCOUNT_ID: account,
      CLOUDFLARE_API_TOKEN: "token-must-not-appear",
    },
    input: `
      const responses = ${JSON.stringify(responses)};
      globalThis.fetch = async (input, options) => {
        if (options.method !== "GET") throw new Error("Mutation attempted");
        const url = new URL(input);
        const path = url.pathname.replace("/client/v4", "").replace("/accounts/${account}", "");
        const fixture = responses[path + url.search] ?? responses[path];
        return Response.json(fixture?.body ?? { success: true, result: [] },
          { status: fixture?.status ?? 200 });
      };
      await import(${JSON.stringify(script.href)});
    `,
  });
  assert.ok(!output.includes("token-must-not-appear"));
  assert.ok(!output.includes("private-error-message"));
  assert.ok(!output.includes("unrelated.example.com"));
  return output
    .split("\n")
    .filter((line) => line.startsWith("{"))
    .map((line) => JSON.parse(line));
}

function page(result, totalPages = 1) {
  return {
    body: { success: true, result, result_info: { total_pages: totalPages } },
  };
}

test("audit finds modern destinations on later pages without publishing unrelated hosts", () => {
  const records = audit({
    "/access/apps?per_page=100&page=1": page(
      [{ domain: "unrelated.example.com" }],
      2,
    ),
    "/access/apps?per_page=100&page=2": page(
      [
        {
          id: "editing-app",
          aud: "b".repeat(64),
          destinations: [
            { type: "public", uri: "edit.leer.education" },
            { type: "public", uri: "unrelated.example.com" },
          ],
        },
      ],
      2,
    ),
    "/access/apps/editing-app/policies": page([
      {
        decision: "allow",
        include: [{ email: { email: "admin@leer.education" } }],
      },
    ]),
  });
  assert.deepEqual(
    records.find((r) => r.check === "access_applications"),
    {
      check: "access_applications",
      total: 2,
      matched: 1,
    },
  );
  const app = records.find((r) => r.check === "access_application");
  assert.deepEqual(app.destinations, ["edit.leer.education"]);
  assert.equal(app.destinationCount, 2);
  assert.equal(app.aud, "b".repeat(64));
  assert.equal(app.policies[0].onlySelectedEditor, true);
});

test("audit reports legacy and overlapping wildcard/path Access applications", () => {
  const records = audit({
    "/access/apps": page([
      { id: "legacy", domain: "edit.leer.education" },
      { id: "wildcard", self_hosted_domains: ["*.leer.education"] },
      {
        id: "path",
        destinations: [{ type: "public", uri: "edit.leer.education/admin/*" }],
      },
      { id: "unrelated", domain: "unrelated.example.com" },
    ]),
  });
  assert.equal(
    records.find((r) => r.check === "access_applications").matched,
    3,
  );
});

test("audit distinguishes unavailable lists from empty results and redacts error details", () => {
  const denied = {
    status: 403,
    body: {
      success: false,
      errors: [
        { code: 10000, message: "private-error-message" },
        { code: "private-error-message" },
      ],
    },
  };
  const records = audit({
    "/access/organizations": denied,
    "/access/apps?per_page=100&page=1": page([], 2),
    "/access/apps?per_page=100&page=2": denied,
  });
  for (const check of ["access_organization", "access_applications"])
    assert.deepEqual(
      records.find((r) => r.check === check),
      {
        check,
        available: false,
        status: 403,
        errorCodes: [10000],
      },
    );
});

test("audit also locates Access applications stored at zone scope", () => {
  const records = audit({
    "/zones": page([{ id: "test-zone" }]),
    "/zones/test-zone/access/organizations": {
      body: {
        success: true,
        result: { auth_domain: "example.cloudflareaccess.com" },
      },
    },
    "/zones/test-zone/access/apps": page([
      { id: "zone-app", domain: "edit.leer.education", aud: "c".repeat(64) },
    ]),
  });
  assert.equal(records.find((r) => r.check === "access_applications").total, 0);
  assert.equal(
    records.find((r) => r.check === "zone_access_applications").matched,
    1,
  );
  assert.equal(
    records.find((r) => r.check === "zone_access_application").aud,
    "c".repeat(64),
  );
  assert.equal(
    records.find((r) => r.check === "zone_access_organization").teamDomain,
    "example.cloudflareaccess.com",
  );
});

test("token verification reports only status and an identifier suffix", () => {
  const records = audit({
    "/user/tokens/verify": {
      body: {
        success: true,
        result: {
          id: `${"d".repeat(24)}0123abcd`,
          status: "active",
          value: "token-must-not-appear",
        },
      },
    },
  });
  assert.deepEqual(
    records.find((r) => r.check === "user_token_verification"),
    {
      check: "user_token_verification",
      available: true,
      tokenStatus: "active",
      identifierSuffix: "0123abcd",
    },
  );
  assert.ok(!JSON.stringify(records).includes("d".repeat(24)));
});
