import assert from "node:assert/strict";
import test from "node:test";
import {
  transition,
  type Reservation,
} from "../../src/editing/reservation-state.ts";

const alice = { email: "admin@leer.education", session: "alice-tab" };
const bob = { email: "reviewer@example.test", session: "bob-tab" };
const owner = alice.email;
const empty: Reservation = { epoch: 0, frozen: false };

test("one site-wide holder wins; expiry never automatically hands off", () => {
  const acquired = transition(
    empty,
    { action: "acquire", actor: alice },
    owner,
    100,
  );
  assert.equal(acquired.status, 200);
  const busy = transition(
    acquired.state,
    { action: "acquire", actor: bob },
    owner,
    1_000_000,
  );
  assert.equal(busy.status, 409);
  assert.equal(busy.view.unresponsive, true);
  assert.deepEqual(busy.state, acquired.state);
  assert.equal(
    transition(
      acquired.state,
      { action: "status", actor: bob },
      owner,
      1_000_000,
    ).status,
    200,
  );
});

test("handoff requires ownership and explicit reconciliation, and rejects the old epoch", () => {
  const acquired = transition(
    empty,
    { action: "acquire", actor: alice },
    owner,
    0,
  );
  assert.equal(
    transition(
      acquired.state,
      { action: "release", actor: alice, epoch: 1 },
      owner,
      1,
    ).status,
    400,
  );
  assert.equal(
    transition(
      acquired.state,
      { action: "release", actor: bob, epoch: 1, reconciled: true },
      owner,
      1,
    ).status,
    409,
  );
  const released = transition(
    acquired.state,
    { action: "release", actor: alice, epoch: 1, reconciled: true },
    owner,
    1,
  );
  const next = transition(
    released.state,
    { action: "acquire", actor: bob },
    owner,
    2,
  );
  assert.equal(next.view.mine, true);
  assert.equal(
    transition(
      next.state,
      { action: "check", actor: alice, epoch: 1 },
      owner,
      3,
    ).status,
    409,
  );
});

test("owner recovery invalidates old forms and keeps editing frozen until reconciliation", () => {
  const acquired = transition(
    empty,
    { action: "acquire", actor: bob },
    owner,
    0,
  );
  assert.equal(
    transition(
      acquired.state,
      { action: "recover", actor: bob, reconciled: true },
      owner,
      1,
    ).status,
    403,
  );
  const recovered = transition(
    acquired.state,
    { action: "recover", actor: alice, reconciled: true },
    owner,
    1,
  );
  assert.equal(recovered.state.frozen, true);
  assert.equal(
    transition(recovered.state, { action: "acquire", actor: alice }, owner, 2)
      .status,
    423,
  );
  assert.equal(
    transition(recovered.state, { action: "resume", actor: alice }, owner, 2)
      .status,
    400,
  );
  const resumed = transition(
    recovered.state,
    { action: "resume", actor: alice, reconciled: true },
    owner,
    3,
  );
  const reacquired = transition(
    resumed.state,
    { action: "acquire", actor: bob },
    owner,
    4,
  );
  assert.equal(
    transition(
      reacquired.state,
      { action: "check", actor: bob, epoch: acquired.state.epoch },
      owner,
      5,
    ).status,
    409,
  );
});

test("heartbeat checks both Access identity and tab session", () => {
  const acquired = transition(
    empty,
    { action: "acquire", actor: alice },
    owner,
    0,
  );
  const anotherTab = { ...alice, session: "another-tab" };
  assert.equal(
    transition(
      acquired.state,
      { action: "heartbeat", actor: anotherTab, epoch: 1 },
      owner,
      5,
    ).status,
    409,
  );
  const updated = transition(
    acquired.state,
    { action: "heartbeat", actor: alice, epoch: 1 },
    owner,
    5,
  );
  assert.equal(updated.state.holder?.lastSeen, 5);
});
