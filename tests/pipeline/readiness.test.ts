import assert from "node:assert/strict";
import test from "node:test";
import { waitForPreviewCommit } from "../../scripts/preview-ready.ts";

const commit = "a".repeat(40);

test("readiness waits through network errors, 404s and the previous release", async () => {
  const responses = [
    new Error("DNS is not ready"),
    new Response(null, { status: 404 }),
    Response.json({ commit: "b".repeat(40) }),
    Response.json({ commit }),
  ];
  let waits = 0;
  await waitForPreviewCommit(
    async (path) => {
      assert.equal(path, "/build.json");
      const response = responses.shift();
      assert.ok(response);
      if (response instanceof Error) throw response;
      return response;
    },
    commit,
    async () => {
      waits++;
    },
  );
  assert.equal(waits, 3);
  assert.equal(responses.length, 0);
});

test("readiness has a fixed retry limit and never accepts the wrong commit", async () => {
  let attempts = 0;
  let waits = 0;
  await assert.rejects(
    waitForPreviewCommit(
      async () => {
        attempts++;
        return Response.json({ commit: "b".repeat(40) });
      },
      commit,
      async () => {
        waits++;
      },
    ),
    /did not serve the validated commit/,
  );
  assert.equal(attempts, 6);
  assert.equal(waits, 5);
});

test("a ready preview proceeds immediately", async () => {
  await waitForPreviewCommit(
    async () => Response.json({ commit }),
    commit,
    async () => {
      assert.fail("An up-to-date preview should not wait.");
    },
  );
});
