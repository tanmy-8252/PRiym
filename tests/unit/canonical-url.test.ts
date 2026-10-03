import { describe, expect, it } from "vitest";
import { canonicalPageUrl } from "@/lib/canonical-url";
import { allowedAuthOrigin } from "@/lib/auth-origin";

const env = { VERCEL_ENV: "production", AUTH_URL: "https://priym.vercel.app" };
const alias = "https://priym-abc-owner.vercel.app";
describe("canonical production navigation", () => {
  it("moves deployment pages to the primary domain preserving query parameters", () => {
    expect(
      canonicalPageUrl(
        `${alias}/account?mode=verify&token=example`,
        "GET",
        env,
      ),
    ).toBe("https://priym.vercel.app/account?mode=verify&token=example");
    expect(canonicalPageUrl(`${alias}/login`, "HEAD", env)).toBe(
      "https://priym.vercel.app/login",
    );
  });
  it("keeps production CSRF origin checks strict", () => {
    expect(canonicalPageUrl(`${alias}/api/account`, "POST", env)).toBeNull();
    expect(allowedAuthOrigin(alias, env.AUTH_URL, false)).toBe(false);
    expect(allowedAuthOrigin(env.AUTH_URL, env.AUTH_URL, false)).toBe(true);
  });
  it("leaves previews, local development, APIs, assets and the primary URL alone", () => {
    for (const path of [
      "/api/account",
      "/api",
      "/_next/static/chunk.js",
      "/favicon.ico",
    ])
      expect(canonicalPageUrl(`${alias}${path}`, "GET", env)).toBeNull();
    expect(canonicalPageUrl(`${env.AUTH_URL}/account`, "GET", env)).toBeNull();
    expect(
      canonicalPageUrl(`${alias}/login`, "GET", {
        ...env,
        VERCEL_ENV: "preview",
      }),
    ).toBeNull();
    expect(
      canonicalPageUrl("http://127.0.0.1:3000/login", "GET", env),
    ).toBeNull();
  });
  it("cannot let paths or malformed settings replace the trusted host", () => {
    const result = canonicalPageUrl(`${alias}//evil.example/login`, "GET", env);
    expect(new URL(result!).origin).toBe(env.AUTH_URL);
    expect(
      canonicalPageUrl(`${alias}/login`, "GET", {
        ...env,
        AUTH_URL: "https://user:password@priym.vercel.app",
      }),
    ).toBeNull();
    expect(
      canonicalPageUrl(`${alias}/login`, "GET", {
        ...env,
        AUTH_URL: "http://priym.vercel.app",
      }),
    ).toBeNull();
  });
});
