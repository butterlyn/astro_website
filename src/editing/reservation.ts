import { DurableObject } from "cloudflare:workers";
import {
  transition,
  type Reservation,
  type ReservationCommand,
} from "./reservation-state";

export class EditingReservation extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS reservation (id INTEGER PRIMARY KEY CHECK (id = 1), value TEXT NOT NULL)",
    );
  }

  // Callable only through the same Worker's authenticated handler and binding.
  async command(command: ReservationCommand) {
    return this.ctx.storage.transactionSync(() => {
      const row = this.ctx.storage.sql
        .exec<{ value: string }>("SELECT value FROM reservation WHERE id = 1")
        .toArray()[0];
      const state: Reservation = row
        ? JSON.parse(row.value)
        : { epoch: 0, frozen: false };
      const result = transition(
        state,
        command,
        this.env.EDITOR_RECOVERY_EMAIL,
        Date.now(),
      );
      if (result.state !== state)
        this.ctx.storage.sql.exec(
          "INSERT INTO reservation (id, value) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value",
          JSON.stringify(result.state),
        );
      return { status: result.status, ...result.view };
    });
  }
}
