import assert from "node:assert/strict";
import test from "node:test";
import { cleanupPreview } from "../../scripts/preview-cleanup.ts";

const env = {
  CLOUDFLARE_ACCOUNT_ID: "a".repeat(32),
  CLOUDFLARE_API_TOKEN: "test-token",
};

function fixture(statuses: number[]) {
  const requested: string[] = [];
  const deleted: string[] = [];
  const messages: string[] = [];
  const options = {
    env,
    fetchImpl: (async (url, init) => {
      requested.push(new URL(String(url)).pathname.split("/").at(-1)!);
      assert.equal(init?.redirect, "error");
      const status = statuses.shift();
      assert.ok(status, "Unexpected Cloudflare request.");
      return new Response(null, { status });
    }) as typeof fetch,
    deleteWorker: (worker: string) => {
      deleted.push(worker);
    },
    log: (message: string) => {
      messages.push(message);
    },
  };
  return { options, requested, deleted, messages };
}

test("cleanup deletes and verifies only the new and original preview Workers", async () => {
  const state = fixture([200, 404, 200, 404]);
  await cleanupPreview(state.options);
  assert.deepEqual(state.deleted, [
    "leer-preview",
    "astro-website-dummy-20260912",
  ]);
  assert.deepEqual(state.requested, [
    "leer-preview",
    "leer-preview",
    "astro-website-dummy-20260912",
    "astro-website-dummy-20260912",
  ]);
  assert.equal(state.messages.length, 2);
});

test("a partial cleanup can be retried without deleting an absent Worker", async () => {
  const state = fixture([404, 200, 404]);
  await cleanupPreview(state.options);
  assert.deepEqual(state.deleted, ["astro-website-dummy-20260912"]);
  assert.equal(state.messages.length, 2);

  const completed = fixture([404, 404]);
  await cleanupPreview(completed.options);
  assert.deepEqual(completed.deleted, []);
  assert.equal(completed.messages.length, 2);
});

test("cleanup stops before deletion when account access cannot be verified", async () => {
  const state = fixture([403]);
  await assert.rejects(cleanupPreview(state.options), /HTTP 403/);
  assert.deepEqual(state.deleted, []);
  assert.deepEqual(state.messages, []);
});

test("cleanup cannot succeed while a deleted Worker is still present", async () => {
  const state = fixture([200, 200]);
  await assert.rejects(
    cleanupPreview(state.options),
    /absence is not confirmed/,
  );
  assert.deepEqual(state.deleted, ["leer-preview"]);
  assert.deepEqual(state.messages, []);
});

test("cleanup requires credentials before making requests or deleting Workers", async () => {
  const state = fixture([]);
  await assert.rejects(
    cleanupPreview({ ...state.options, env: {} }),
    /repository secrets/,
  );
  assert.deepEqual(state.requested, []);
  assert.deepEqual(state.deleted, []);
});
