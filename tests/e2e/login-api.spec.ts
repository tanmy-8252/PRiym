import { test, expect, type APIRequestContext } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { demoAccounts } from "../../src/lib/demo";
const baseURL = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
const password = process.env.DEMO_PASSWORD!;
const paths = {
  STUDENT: "/profile",
  FACULTY: "/submissions",
  HOD: "/settings",
  ADMIN: "/admin",
};
async function login(
  client: APIRequestContext,
  email: string,
  password: string,
  otp = "",
) {
  const csrf = await (await client.get("/api/auth/csrf")).json();
  const response = await client.post("/api/auth/callback/credentials", {
    form: {
      csrfToken: csrf.csrfToken,
      email,
      password,
      otp,
      callbackUrl: `${baseURL}/dashboard`,
    },
    headers: { "X-Auth-Return-Redirect": "1" },
  });
  expect(response.status()).toBe(200);
  return response.json();
}
function code(role: string) {
  // Run the exact documented CLI, which reads the encrypted account secret from DB.
  const result = JSON.parse(
    execFileSync(
      process.execPath,
      [
        "node_modules/tsx/dist/cli.mjs",
        "scripts/demo-otp.ts",
        "--role",
        role,
        "--json",
      ],
      { encoding: "utf8", timeout: 40000 },
    ),
  );
  expect(result.codes[0].role).toBe(role);
  expect(result.codes[0].email).toBe(`${role.toLowerCase()}@atria.edu`);
  expect(result.validForSeconds).toBeGreaterThanOrEqual(14);
  return result.codes[0].code;
}
for (const account of demoAccounts) {
  test(`${account.label}: real Auth.js cookie, role dashboard, RBAC and local actions`, async ({
    playwright,
  }) => {
    const client = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: { Origin: baseURL },
    });
    try {
      const page = await client.get("/login");
      const html = await page.text();
      for (const a of demoAccounts)
        expect(html).toContain(`>${a.label}</button>`);
      expect(html).toContain(password);
      const otp = ["HOD", "ADMIN"].includes(account.role)
        ? code(account.role)
        : "";
      const result = await login(client, account.email, password, otp);
      expect(result.error).toBeUndefined();
      expect(result.url).toBe(`${baseURL}/dashboard`);
      const session = await (await client.get("/api/auth/session")).json();
      expect(session.user.email).toBe(account.email);
      expect(session.user.id).toBeTruthy();
      expect(session.sessionId).toBeTruthy();
      expect(session.user.passwordHash).toBeUndefined();
      expect(session.user.mfaSecret).toBeUndefined();
      const dashboard = await client.get(new URL(result.url).pathname, {
        maxRedirects: 0,
      });
      expect(dashboard.status()).toBe(200);
      const dashboardHtml = await dashboard.text();
      expect(dashboardHtml).toContain(
        account.role === "STUDENT"
          ? "Your merit journey"
          : account.role === "FACULTY"
            ? "Your review queue"
            : account.role === "HOD"
              ? "Your department, in perspective."
              : "Keep the platform moving.",
      );
      expect(
        (await client.get(paths[account.role], { maxRedirects: 0 })).status(),
      ).toBe(200);
      expect((await client.get("/api/v1/audit")).status()).toBe(
        account.role === "ADMIN" ? 200 : 403,
      );
      // Exercise the formerly rejected same-origin path using synthetic demo profile defaults.
      const profile = await client.patch("/api/v1/profile", {
        data: { bio: "", portfolioPublic: false, leaderboardVisible: true },
      });
      expect(profile.status()).toBe(200);
      expect(
        (
          await client.patch("/api/v1/profile", {
            headers: { Origin: "https://evil.example" },
            data: { bio: "", portfolioPublic: false, leaderboardVisible: true },
          })
        ).status(),
      ).toBe(403);
      expect(
        (
          await client.patch("/api/v1/profile", {
            headers: { Origin: "http://127.0.0.1:3001" },
            data: { bio: "", portfolioPublic: false, leaderboardVisible: true },
          })
        ).status(),
      ).toBe(403);
    } finally {
      await client.dispose();
    }
  });
}
test("invalid credentials and missing mandatory MFA do not create sessions", async ({
  playwright,
}) => {
  for (const credentials of [
    { email: "student@atria.edu", password: "WrongPass1!" },
    { email: "hod@atria.edu", password },
  ]) {
    const client = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: { Origin: baseURL },
    });
    try {
      const result = await login(
        client,
        credentials.email,
        credentials.password,
      );
      expect(result.url).toContain("error=CredentialsSignin");
      const session = await (await client.get("/api/auth/session")).json();
      expect(session?.user).toBeUndefined();
      expect(
        (await client.get("/dashboard", { maxRedirects: 0 })).status(),
      ).toBe(307);
    } finally {
      await client.dispose();
    }
  }
});
