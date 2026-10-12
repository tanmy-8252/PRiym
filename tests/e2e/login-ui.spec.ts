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
  HOD: "/login",
  ADMIN: "/login",
};

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
      loginRequests.filter((request) => request === `POST ${path}`),
    ).toHaveLength(1);
    expect(
      loginRequests.some((request) => request.startsWith("GET /api/auth/")),
    ).toBe(false);
    expect(
      loginRequests.some((request) => request === "GET /api/v1/session"),
    ).toBe(false);
  });
}
