import { afterEach, describe, expect, it, vi } from "vitest";
import { allowedAuthOrigin, authRedirect } from "@/lib/auth-origin";
import { assertLocalDemo, demoAccounts, localDemoEnabled } from "@/lib/demo";
import { generateTotp, verifyTotp, totpStep } from "@/lib/totp";
afterEach(() => vi.unstubAllEnvs());
const env = {
  NODE_ENV: "development",
  SEED_DEMO: "true",
  DATABASE_URL: "postgresql://p:p@127.0.0.1:54329/postgres",
  DEMO_PASSWORD: "CustomDemo9!",
  DEMO_TOTP_SECRET: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
} as NodeJS.ProcessEnv;
describe("local authentication configuration", () => {
  it("only allows local demo reset on an opted-in nonproduction database", () => {
    expect(demoAccounts.map((a) => a.email)).toEqual([
      "student@atria.edu",
      "faculty@atria.edu",
      "hod@atria.edu",
      "admin@atria.edu",
    ]);
    expect(() => assertLocalDemo(env)).not.toThrow();
    for (const changed of [
      { NODE_ENV: "production" as const },
      { SEED_DEMO: "false" },
      { DATABASE_URL: "postgresql://p:p@db.example/priym" },
    ]) {
      expect(localDemoEnabled({ ...env, ...changed })).toBe(false);
      expect(() => assertLocalDemo({ ...env, ...changed })).toThrow();
    }
    expect(() =>
      assertLocalDemo({ ...env, DEMO_TOTP_SECRET: "replace-with-secret" }),
    ).toThrow();
  });
  it("allows same-port loopback aliases only in development", () => {
    const canonical = "http://localhost:3000";
    expect(allowedAuthOrigin("http://127.0.0.1:3000", canonical, true)).toBe(
      true,
    );
    expect(allowedAuthOrigin("http://127.0.0.1:3000", canonical, false)).toBe(
      false,
    );
    expect(allowedAuthOrigin(canonical, canonical, false)).toBe(true);
    for (const origin of [
      null,
      "null",
      "http://127.0.0.1:3001",
      "https://localhost:3000",
      "https://evil.example",
      "http://localhost.evil.example:3000",
    ]) {
      expect(allowedAuthOrigin(origin, canonical, true)).toBe(false);
    }
    vi.stubEnv("NODE_ENV", "production");
    expect(authRedirect("http://127.0.0.1:3000/dashboard", canonical)).toBe(
      canonical,
    );
    expect(authRedirect("/dashboard", canonical)).toBe(
      `${canonical}/dashboard`,
    );
    expect(authRedirect("//evil.example", canonical)).toBe(canonical);
  });
  it("uses RFC TOTP SHA1, six digits, 30 seconds and a strict current interval", () => {
    const secret = env.DEMO_TOTP_SECRET!;
    expect(generateTotp(secret, 59_000)).toBe("287082");
    expect(verifyTotp("287082", secret, 59_000)).toBe(true);
    expect(verifyTotp("287082", secret, 60_000)).toBe(false);
    expect(verifyTotp("287082", secret, 29_000)).toBe(false);
    expect(verifyTotp("94287082", secret, 59_000)).toBe(false);
    expect(totpStep(59_000)).toBe(1n);
  });
});
