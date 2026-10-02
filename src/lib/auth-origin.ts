import { isLoopback } from "./demo";
export function allowedAuthOrigin(
  origin: string | null,
  canonical: string,
  development = process.env.NODE_ENV === "development",
) {
  if (!origin) return false;
  try {
    const candidate = new URL(origin),
      base = new URL(canonical);
    if (candidate.username || candidate.password) return false;
    return (
      candidate.origin === base.origin ||
      (development &&
        isLoopback(candidate.hostname) &&
        isLoopback(base.hostname) &&
        candidate.protocol === base.protocol &&
        candidate.port === base.port)
    );
  } catch {
    return false;
  }
}
export function authRedirect(url: string, baseUrl: string) {
  if (url.startsWith("/") && !url.startsWith("//"))
    return new URL(url, baseUrl).href;
  return allowedAuthOrigin(url, baseUrl) ? url : baseUrl;
}
