export type Editor = { email: string; session: string };
export type Reservation = {
  epoch: number;
  frozen: boolean;
  holder?: Editor & { lastSeen: number };
};
export type ReservationAction =
  | "status"
  | "acquire"
  | "heartbeat"
  | "check"
  | "release"
  | "freeze"
  | "recover"
  | "resume";
export type ReservationCommand = {
  action: ReservationAction;
  actor: Editor;
  epoch?: number;
  reconciled?: boolean;
};

export type ReservationView = {
  epoch: number;
  frozen: boolean;
  mine: boolean;
  occupied: boolean;
  holder?: string;
  unresponsive: boolean;
  recoveryOwner: boolean;
};
export function parseReservationView(input: unknown): ReservationView {
  if (!input || typeof input !== "object")
    throw new Error("Invalid reservation response.");
  const value = input as Record<string, unknown>;
  if (
    !Number.isSafeInteger(value.epoch) ||
    ["frozen", "mine", "occupied", "unresponsive", "recoveryOwner"].some(
      (key) => typeof value[key] !== "boolean",
    ) ||
    (value.holder !== undefined && typeof value.holder !== "string")
  )
    throw new Error("Invalid reservation response.");
  return value as ReservationView;
}

export function transition(
  state: Reservation,
  command: ReservationCommand,
  recoveryOwner: string,
  now: number,
) {
  const { action, actor } = command;
  const holder = state.holder;
  const mine =
    holder?.email === actor.email && holder?.session === actor.session;
  const current = mine && command.epoch === state.epoch;
  const owner = actor.email === recoveryOwner;
  let status = 200;
  let next = state;
  if (action === "status") {
    /* Read-only; never expires a reservation. */
  } else if (action === "acquire") {
    if (state.frozen) status = 423;
    else if (holder && !mine) status = 409;
    else if (!holder)
      next = {
        ...state,
        epoch: state.epoch + 1,
        holder: { ...actor, lastSeen: now },
      };
  } else if (action === "check" || action === "heartbeat") {
    if (state.frozen) status = 423;
    else if (!current) status = 409;
    else if (action === "heartbeat")
      next = { ...state, holder: { ...actor, lastSeen: now } };
  } else if (action === "release") {
    if (!current) status = 409;
    else if (!command.reconciled) status = 400;
    else next = { epoch: state.epoch + 1, frozen: state.frozen };
  } else if (
    action === "freeze" ||
    action === "recover" ||
    action === "resume"
  ) {
    if (!owner) status = 403;
    else if (!command.reconciled) status = 400;
    else if (action === "resume" && holder) status = 409;
    else next = { epoch: state.epoch + 1, frozen: action !== "resume" };
  } else status = 400;
  return {
    state: next,
    status,
    view: {
      epoch: next.epoch,
      frozen: next.frozen,
      mine:
        next.holder?.email === actor.email &&
        next.holder?.session === actor.session,
      occupied: Boolean(next.holder),
      holder: next.holder?.email,
      unresponsive: next.holder ? now - next.holder.lastSeen > 120_000 : false,
      recoveryOwner: owner,
    },
  };
}
