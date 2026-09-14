export async function waitForPreviewCommit(
  get: (path: string) => Promise<Response>,
  commit: string,
  wait = () => new Promise<void>((resolve) => setTimeout(resolve, 5000)),
) {
  // A successful upload can precede workers.dev serving the new release.
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const response = await get("/build.json");
      if (response.status === 200) {
        const build = (await response.json()) as { commit?: string };
        if (build.commit === commit) return;
      } else {
        await response.body?.cancel();
      }
    } catch {
      // Initial DNS, HTTP and incomplete-release responses may need time to settle.
    }
    if (attempt < 5) await wait();
  }
  throw new Error(
    "The preview did not serve the validated commit after six readiness checks.",
  );
}
