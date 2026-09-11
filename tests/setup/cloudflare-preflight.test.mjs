import assert from "node:assert/strict";
import test from "node:test";
import { runPreflight } from "../../scripts/cloudflare-preflight.mjs";

const env = {
  CLOUDFLARE_ACCOUNT_ID: "a".repeat(32),
  CLOUDFLARE_API_TOKEN: "test-secret-never-log",
};
const success = (result) => Response.json({ success: true, result });

test("missing or malformed credentials fail before any network request", async () => {
  for (const invalid of [
    {},
    { ...env, CLOUDFLARE_ACCOUNT_ID: "../other-account" },
  ]) {
    await assert.rejects(
      runPreflight({
        env: invalid,
        fetchImpl: () => assert.fail("must not send malformed credentials"),
      }),
      /CLOUDFLARE_ACCOUNT_ID/,
    );
  }
});

test("valid credentials use only GET on Cloudflare and reject redirects", async () => {
  const requests = [];
  const messages = [];
  await runPreflight({
    env,
    log: (message) => messages.push(message),
    fetchImpl: async (url, options) => {
      requests.push(url);
      assert.equal(options.method, "GET");
      assert.equal(options.redirect, "error");
      assert.equal(
        options.headers.Authorization,
        `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      );
      assert.ok(options.signal instanceof AbortSignal);
      return requests.length === 1
        ? success([{ id: "private-worker-name" }])
        : success({ subdomain: "private-subdomain" });
    },
  });
  assert.deepEqual(requests, [
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/workers/scripts`,
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/workers/subdomain`,
  ]);
  const output = messages.join("\n");
  for (const secret of [
    ...Object.values(env),
    "private-worker-name",
    "private-subdomain",
  ]) {
    assert.ok(!output.includes(secret));
  }
  assert.match(output, /Deployment and deletion permissions still require/);
});

test("HTTP authentication failures give a fix without logging the response body", async () => {
  for (const status of [401, 403]) {
    await assert.rejects(
      runPreflight({
        env,
        fetchImpl: async () =>
          new Response(env.CLOUDFLARE_API_TOKEN, { status }),
      }),
      (error) => {
        assert.match(error.message, new RegExp(`HTTP ${status}`));
        assert.match(error.message, /Update the repository secrets/);
        assert.ok(!error.message.includes(env.CLOUDFLARE_API_TOKEN));
        return true;
      },
    );
  }
});

test("network errors cannot leak credentials through native error messages", async () => {
  await assert.rejects(
    runPreflight({
      env,
      fetchImpl: async () => {
        throw new Error(env.CLOUDFLARE_API_TOKEN);
      },
    }),
    (error) => {
      assert.match(error.message, /failed or timed out/);
      assert.ok(!error.message.includes(env.CLOUDFLARE_API_TOKEN));
      return true;
    },
  );
});

test("malformed and unsuccessful API responses fail closed", async () => {
  for (const response of [
    new Response("not JSON"),
    Response.json({
      success: false,
      errors: [{ message: env.CLOUDFLARE_API_TOKEN }],
    }),
    success({}),
  ]) {
    await assert.rejects(
      runPreflight({ env, fetchImpl: async () => response }),
      (error) => {
        assert.ok(!error.message.includes(env.CLOUDFLARE_API_TOKEN));
        return true;
      },
    );
  }
});

test("missing workers.dev subdomain explains the required dashboard action", async () => {
  for (const response of [
    success({ subdomain: "" }),
    new Response("missing", { status: 404 }),
  ]) {
    let calls = 0;
    await assert.rejects(
      runPreflight({
        env,
        log: () => {},
        fetchImpl: async () => (++calls === 1 ? success([]) : response),
      }),
      /subdomain.*Cloudflare dashboard/,
    );
  }
});
