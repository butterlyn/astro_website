import { createRemoteJWKSet, jwtVerify } from "jose";

// Reuse jose's bounded key cache across asset and page requests in an isolate.
let keySource:
  { issuer: string; keys: ReturnType<typeof createRemoteJWKSet> } | undefined;

export async function accessIdentity(
  request: Request,
  env: Env,
): Promise<string | undefined> {
  const url = new URL(request.url);
  if (
    import.meta.env.TINA_LOCAL_PROOF &&
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  )
    return "admin@leer.education";
  const token = request.headers.get("cf-access-jwt-assertion");
  if (
    !token ||
    !/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(env.ACCESS_TEAM_DOMAIN) ||
    !env.ACCESS_AUD
  )
    return undefined;
  try {
    const issuer = `https://${env.ACCESS_TEAM_DOMAIN}`;
    if (keySource?.issuer !== issuer)
      keySource = {
        issuer,
        keys: createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`)),
      };
    const { keys } = keySource;
    const { payload } = await jwtVerify(token, keys, {
      issuer,
      audience: env.ACCESS_AUD,
      algorithms: ["RS256"],
    });
    return typeof payload.email === "string"
      ? payload.email.toLowerCase()
      : undefined;
  } catch {
    return undefined;
  }
}
