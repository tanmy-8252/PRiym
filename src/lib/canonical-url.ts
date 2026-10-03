type Environment = Record<string, string | undefined>;

export function canonicalPageUrl(
  requestUrl: string,
  method: string,
  env: Environment = process.env,
): string | null {
  if (
    env.VERCEL_ENV !== "production" ||
    !env.AUTH_URL ||
    !["GET", "HEAD"].includes(method)
  )
    return null;
  try {
    const current = new URL(requestUrl),
      canonical = new URL(env.AUTH_URL);
    if (
      canonical.protocol !== "https:" ||
      canonical.username ||
      canonical.password ||
      current.origin === canonical.origin ||
      !current.hostname.endsWith(".vercel.app") ||
      /^\/(api(?:\/|$)|_next(?:\/|$))/.test(current.pathname) ||
      /\.[^/]+$/.test(current.pathname)
    )
      return null;
    // Assign path/query instead of resolving a relative URL: //evil cannot
    // change the trusted destination host.
    canonical.pathname = current.pathname;
    canonical.search = current.search;
    canonical.hash = "";
    return canonical.href;
  } catch {
    return null;
  }
}
