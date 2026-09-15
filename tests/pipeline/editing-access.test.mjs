import assert from "node:assert/strict";
import test from "node:test";
import {
  validateEditingDeploymentConfig,
  verifyEditingAccess,
} from "../../scripts/editing-access.mjs";

const config = {
  name: "leer-editing",
  workers_dev: false,
  preview_urls: false,
  assets: { run_worker_first: true },
  routes: [{ pattern: "edit.leer.education", custom_domain: true }],
  vars: {
    ACCESS_TEAM_DOMAIN: "example.cloudflareaccess.com",
    ACCESS_AUD: "a".repeat(64),
    EDITOR_RECOVERY_EMAIL: "admin@leer.education",
  },
};
const app = {
  id: "test-app",
  type: "self_hosted",
  destinations: [{ type: "public", uri: "edit.leer.education" }],
  aud: config.vars.ACCESS_AUD,
  session_duration: "8h",
  allowed_idps: ["otp"],
};
const policy = {
  decision: "allow",
  include: [{ email: { email: "admin@leer.education" } }],
};
function api(changes = {}) {
  const results = {
    "/access/organizations": { auth_domain: config.vars.ACCESS_TEAM_DOMAIN },
    "/access/apps": [app],
    "/access/identity_providers": [{ id: "otp", type: "onetimepin" }],
    "/access/apps/test-app/policies": [policy],
    "/workers/domains": [
      { hostname: "leer.education", service: "leer-preview" },
    ],
    ...changes,
  };
  return async (path) => ({ result: results[path.split("?")[0]] });
}

test("the preview deploy target cannot acquire public routes or alternate entry points", () => {
  validateEditingDeploymentConfig(config);
  for (const change of [
    { name: "leer-preview" },
    { name: "leer-production" },
    { workers_dev: true },
    { preview_urls: true },
    { assets: { run_worker_first: false } },
    { routes: [{ pattern: "leer.education", custom_domain: true }] },
    { routes: [] },
    { vars: { ...config.vars, ACCESS_AUD: "" } },
  ])
    assert.throws(() =>
      validateEditingDeploymentConfig({ ...config, ...change }),
    );
});

test("Access verification rejects missing protection, bypasses, broader identities and audience drift", async () => {
  await verifyEditingAccess(config, api());
  for (const changes of [
    { "/access/apps": [] },
    { "/access/apps": [{ ...app, aud: "b".repeat(64) }] },
    { "/access/apps": [{ ...app, allowed_idps: [] }] },
    { "/access/apps": [{ ...app, options_preflight_bypass: true }] },
    {
      "/access/apps": [
        app,
        {
          ...app,
          domain: "edit.leer.education/admin",
          destinations: undefined,
        },
      ],
    },
    {
      "/access/apps": [
        app,
        { ...app, destinations: [{ type: "public", uri: "*.leer.education" }] },
      ],
    },
    { "/access/apps/test-app/policies": [{ ...policy, decision: "bypass" }] },
    {
      "/access/apps/test-app/policies": [
        { ...policy, include: [{ everyone: {} }] },
      ],
    },
    {
      "/access/apps/test-app/policies": [
        {
          ...policy,
          include: [
            ...policy.include,
            { email: { email: "someone@example.com" } },
          ],
        },
      ],
    },
    {
      "/workers/domains": [
        { hostname: "edit.leer.education", service: "another-worker" },
      ],
    },
    { "/access/organizations": { auth_domain: "wrong.cloudflareaccess.com" } },
  ])
    await assert.rejects(verifyEditingAccess(config, api(changes)));
});

test("Access verification inspects every page and fails if its API is unavailable", async () => {
  const get = api();
  await assert.rejects(
    verifyEditingAccess(config, async (path) => {
      if (path.startsWith("/access/apps?"))
        return {
          result: path.endsWith("page=1")
            ? [app]
            : [
                {
                  ...app,
                  destinations: [
                    { type: "public", uri: "edit.leer.education/admin/*" },
                  ],
                },
              ],
          result_info: { total_pages: 2 },
        };
      return get(path);
    }),
    /Exactly one whole-host/,
  );
  await assert.rejects(
    verifyEditingAccess(config, async () => {
      throw new Error("HTTP 403");
    }),
    /HTTP 403/,
  );
});
