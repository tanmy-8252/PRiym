import { test, expect } from "@playwright/test";
import { demoAccounts } from "../../src/lib/demo";
import { demoOtp } from "./demo-otp";

// A developer can use an installed Chrome if Playwright's Chromium is absent.
test.use({
  launchOptions: process.env.PRIYM_USE_LOCAL_CHROME
    ? { channel: "chrome" }
    : {},
});

const loginPath = {
  STUDENT: "/student/login",
  FACULTY: "/faculty/login",
  HOD: "/login?role=hod",
  ADMIN: "/login?role=admin",
};

test("requires an account category before showing credential fields", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(page.getByLabel("Institutional email")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Sign in →" })).toHaveCount(0);
  await page.getByRole("link", { name: "Student", exact: true }).click();
  await expect(page.getByLabel("Institutional email")).toBeVisible();
  await expect(page.getByLabel("Authenticator code")).toHaveCount(0);
  await page.getByRole("button", { name: "I use an authenticator" }).click();
  await expect(page.getByLabel("Authenticator code")).toBeVisible();
});

for (const account of demoAccounts) {
  test(`${account.label} signs in through the role page with one action request`, async ({
    page,
  }) => {
    const path = loginPath[account.role];
    const loginRequests: string[] = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (
        url.origin === new URL(page.url()).origin &&
        (url.pathname.startsWith("/api/") || request.method() === "POST")
      ) {
        loginRequests.push(`${request.method()} ${url.pathname}`);
      }
    });

    await page.goto(path);
    if (account.role === "STUDENT" || account.role === "FACULTY") {
      await expect(page.getByLabel("Authenticator code")).toHaveCount(0);
    } else {
      await expect(page.getByLabel("Authenticator code")).toBeVisible();
    }
    await page
      .getByRole("button", { name: account.label, exact: true })
      .click();
    if (account.role === "HOD" || account.role === "ADMIN") {
      await page.getByLabel(/Authenticator code/).fill(demoOtp(account.role));
    }
    await page.getByRole("button", { name: "Sign in →" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page
        .getByText(
          account.role === "STUDENT"
            ? "Your merit journey"
            : account.role === "FACULTY"
              ? "Your review queue"
              : account.role === "HOD"
                ? "Your department, in perspective."
                : "Keep the platform moving.",
        )
        .first(),
    ).toBeVisible();
    expect(
      loginRequests.filter(
        (request) =>
          request === `POST ${new URL(path, "http://localhost").pathname}`,
      ),
    ).toHaveLength(1);
    expect(
      loginRequests.some((request) => request.startsWith("GET /api/auth/")),
    ).toBe(false);
    expect(
      loginRequests.some((request) => request === "GET /api/v1/session"),
    ).toBe(false);
  });
}
