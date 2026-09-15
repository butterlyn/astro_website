import { handle } from "@astrojs/cloudflare/handler";
import { accessIdentity } from "./access";
import type { ReservationAction } from "./reservation-state";
export { EditingReservation } from "./reservation";

const sessionPattern = /^[a-f0-9-]{36}$/;
const actions = new Set<ReservationAction>([
  "status",
  "acquire",
  "heartbeat",
  "check",
  "release",
  "freeze",
  "recover",
  "resume",
]);
const privateHeaders = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

export default {
  async fetch(request, env, ctx) {
    const email = await accessIdentity(request, env);
    if (!email)
      return new Response("Private editing access has not been verified.", {
        status: 403,
        headers: privateHeaders,
      });
    const url = new URL(request.url);
    const reservation = env.EDITING_RESERVATION.getByName("website");
    if (url.pathname === "/api/editing-reservation") {
      if (
        request.method !== "POST" ||
        request.headers.get("origin") !== url.origin ||
        request.headers.get("content-type") !== "application/json"
      )
        return new Response("Invalid reservation request.", {
          status: 403,
          headers: privateHeaders,
        });
      const session = request.headers.get("x-editing-session") ?? "";
      if (!sessionPattern.test(session))
        return new Response("Missing browser session.", {
          status: 400,
          headers: privateHeaders,
        });
      const body = request.body?.getReader();
      if (!body)
        return new Response("Missing command.", {
          status: 400,
          headers: privateHeaders,
        });
      let text = "";
      let size = 0;
      const decoder = new TextDecoder();
      try {
        while (true) {
          const chunk = await body.read();
          if (chunk.done) break;
          size += chunk.value.byteLength;
          if (size > 2048) {
            await body.cancel();
            return new Response("Command too large.", {
              status: 413,
              headers: privateHeaders,
            });
          }
          text += decoder.decode(chunk.value, { stream: true });
        }
        text += decoder.decode();
        const command = JSON.parse(text);
        if (
          !actions.has(command.action) ||
          (command.epoch !== undefined && !Number.isSafeInteger(command.epoch))
        )
          throw new Error("Invalid command");
        const result = await reservation.command({
          action: command.action,
          actor: { email, session },
          epoch: command.epoch,
          reconciled: command.reconciled === true,
        });
        const headers = new Headers(privateHeaders);
        if (result.status === 200 && command.action === "acquire")
          headers.set(
            "Set-Cookie",
            `leer_editing_session=${session}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400${url.protocol === "https:" ? "; Secure" : ""}`,
          );
        return Response.json(result, { status: result.status, headers });
      } catch {
        return new Response("Invalid reservation command.", {
          status: 400,
          headers: privateHeaders,
        });
      } finally {
        body.releaseLock();
      }
    }
    if (["/admin", "/admin/", "/admin/index.html"].includes(url.pathname)) {
      const session = request.headers
        .get("cookie")
        ?.match(/(?:^|;\s*)leer_editing_session=([a-f0-9-]{36})(?:;|$)/)?.[1];
      const state = session
        ? await reservation.command({
            action: "status",
            actor: { email, session },
          })
        : undefined;
      if (!state?.mine || state.frozen)
        return new Response(null, {
          status: 303,
          headers: { ...privateHeaders, Location: "/edit/" },
        });
    }
    const response = await handle(request, env, ctx);
    const headers = new Headers(response.headers);
    for (const [name, value] of Object.entries(privateHeaders))
      headers.set(name, value);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
} satisfies ExportedHandler<Env>;
