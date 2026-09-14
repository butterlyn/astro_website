import assert from "node:assert/strict";
import test from "node:test";
import { Form, TinaAdminApi, TinaMediaStore } from "tinacms";

// These are executable counterexamples against the pinned, exported Tina APIs.
// A passing test confirms a limitation, not an accepted editing lock. Only the
// network/content service is simulated; Tina's implementation is unmodified.
test("Tina beforeSubmit rejects a lost reservation and preserves unsaved values", async () => {
  let writes = 0;
  const form = new Form({
    id: "page",
    label: "Page",
    fields: [],
    initialValues: { title: "Saved" },
    onSubmit: async () => {
      writes++;
    },
  });
  form.beforeSubmit = async () => {
    throw new Error(
      "Editing ownership was lost. Copy your text before reloading.",
    );
  };
  form.change("title", "Unsaved text");
  const errors = await form.submit();
  assert.equal(writes, 0);
  assert.equal(form.values.title, "Unsaved text");
  assert.ok(
    Object.values(errors).some((error) =>
      error.message?.includes("ownership was lost"),
    ),
  );
});

test("an already admitted form write can finish after heartbeat expiry and handoff", async () => {
  let owner = "browser-a";
  let saved = "original";
  let releaseWrite;
  let beganWrite;
  const started = new Promise((resolve) => {
    beganWrite = resolve;
  });
  const pending = new Promise((resolve) => {
    releaseWrite = resolve;
  });
  const form = new Form({
    id: "page",
    label: "Page",
    fields: [],
    initialValues: { title: "original" },
    onSubmit: async (values) => {
      beganWrite();
      await pending;
      saved = values.title;
    },
  });
  form.beforeSubmit = async () => {
    if (owner !== "browser-a") throw new Error("Not the editor");
  };
  form.change("title", "late browser-a write");
  const save = form.submit();
  await started;
  // Models the prohibited timeout-only handoff, not the proposed coordinator.
  owner = "browser-b";
  saved = "browser-b write";
  releaseWrite();
  await save;
  assert.equal(saved, "late browser-a write");
});

test("ordinary document deletion bypasses collection beforeSubmit", async () => {
  let hooks = 0;
  const writes = [];
  const collection = {
    name: "proofPage",
    ui: {
      beforeSubmit: async () => {
        hooks++;
        throw new Error("Busy");
      },
    },
  };
  const api = new TinaAdminApi({
    api: {
      tina: {
        schema: { getCollection: () => collection },
        request: async (query, options) => {
          writes.push({ query, options });
          return {};
        },
      },
    },
  });
  await api.deleteDocument({
    collection: "proofPage",
    relativePath: "proof.md",
  });
  assert.equal(hooks, 0);
  assert.equal(writes.length, 1);
  assert.match(writes[0].query, /deleteDocument/);
  assert.deepEqual(writes[0].options.variables, {
    collection: "proofPage",
    relativePath: "proof.md",
  });
});

test("custom content API disables standard hosted repository media", async () => {
  const store = new TinaMediaStore({
    api: { tina: { isLocalMode: false, isCustomContentApi: true } },
  });
  await assert.rejects(store.persist([]), (error) =>
    JSON.stringify(error).includes("self-host"),
  );
  await assert.rejects(
    store.delete({ directory: "", filename: "proof.svg" }),
    (error) => JSON.stringify(error).includes("self-host"),
  );
});
