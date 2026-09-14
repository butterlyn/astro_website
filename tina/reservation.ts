type Session = { session: string; epoch: number };

function initialSession(): Session | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const value = JSON.parse(sessionStorage.getItem("leer.editing") ?? "null");
    return value &&
      typeof value.session === "string" &&
      Number.isSafeInteger(value.epoch)
      ? value
      : undefined;
  } catch {
    return undefined;
  }
}

// Capture the epoch when this admin loads. Reading a newer epoch at save time
// would allow a stale form to save after handoff without an explicit reload.
const openedSession = initialSession();

export async function beforeSubmit({
  values,
}: {
  values: Record<string, unknown>;
}) {
  try {
    sessionStorage.setItem("leer.unsaved-backup", JSON.stringify(values));
  } catch {
    /* The form still retains its text if browser storage is full. */
  }
  if (!openedSession)
    throw new Error(
      "Open the editor through /edit/ to reserve editing. Copy your unsaved text before reloading.",
    );
  let response: Response;
  try {
    response = await fetch("/api/editing-reservation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Editing-Session": openedSession.session,
      },
      body: JSON.stringify({ action: "check", epoch: openedSession.epoch }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new Error(
      "Cannot verify editing ownership. Your text is still in this form; copy it before reloading.",
    );
  }
  if (!response.ok)
    throw new Error(
      "Editing was paused or handed over. Keep a copy of your unsaved text, then explicitly reload the saved content.",
    );
  return values;
}
