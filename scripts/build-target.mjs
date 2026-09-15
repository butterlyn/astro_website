export function buildTarget(env) {
  const target = env.BUILD_TARGET;
  if (target !== "production" && target !== "editing")
    throw new Error("Set BUILD_TARGET to production or editing.");
  const branch = target === "editing" ? "development" : "main";
  if (env.CONTENT_BRANCH !== branch)
    throw new Error(`${target} requires CONTENT_BRANCH=${branch}.`);
  if (target === "editing" && env.TINA_BRANCH !== "development")
    throw new Error("TINA_BRANCH must be development; no fallback is allowed.");
  if (target === "production" && env.TINA_BRANCH)
    throw new Error("Production must not select a live Tina branch.");
  return { target, branch };
}
