import { randomUUID } from "node:crypto";
import { test, expect, Page } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import { demoOtp } from "./demo-otp";
import { mkdir } from "node:fs/promises";
async function login(page: Page, role: string) {
  await page.goto("/login");
  await page.getByLabel("Institutional email").fill(`${role}@atria.edu`);
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env.DEMO_PASSWORD || "PriymDemo1!");
  if (["hod", "admin"].includes(role))
    await page
      .getByLabel("Authenticator code", { exact: false })
      .fill(demoOtp(role));
  await page.getByRole("button", { name: "Sign in →", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
}
test("student uploads, faculty approves, points and status appear for both users", async ({
  browser,
}) => {
  const studentContext = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    }),
    facultyContext = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
  const student = await studentContext.newPage(),
    faculty = await facultyContext.newPage();
  await login(student, "student");
  await mkdir("docs/screenshots", { recursive: true });
  await student.screenshot({
    path: "docs/screenshots/student-dashboard.png",
    fullPage: true,
  });
  const title = `Browser verified achievement ${randomUUID()}`;
  await student
    .getByRole("link", { name: "Add achievement", exact: false })
    .first()
    .click();
  await student.getByLabel("Achievement title").fill(title);
  await student
    .getByLabel("Category *", { exact: true })
    .selectOption({ label: "Certifications · 50 base points" });
  await student.getByLabel("Achievement level").selectOption("NATIONAL");
  await student
    .getByLabel("Issuing organization")
    .fill("Browser Test Institute");
  await student
    .getByLabel("Achievement date")
    .fill(new Date().toISOString().slice(0, 10));
  await student
    .getByLabel("Tell us about the achievement")
    .fill(
      "A complete browser-tested achievement backed by a supporting evidence document.",
    );
  const pdf = await PDFDocument.create();
  pdf.addPage().drawText("Evidence for the PRiym browser test.");
  await student.getByLabel("Upload supporting evidence").setInputFiles({
    name: "browser-evidence.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(await pdf.save()),
  });
  await expect(
    student.getByText("browser-evidence.pdf", { exact: true }),
  ).toBeVisible();
  await student.getByRole("button", { name: "Submit for review" }).click();
  await expect(student).toHaveURL(/submissions\/[a-f0-9-]+$/);
  const url = student.url();
  await expect(
    student.getByText("Submitted", { exact: true }).first(),
  ).toBeVisible();
  await login(faculty, "faculty");
  await faculty.goto(url);
  for (const item of [
    "Evidence is authentic and readable",
    "Student identity and achievement date match",
    "Category, level and result are accurate",
  ])
    await faculty.getByLabel(item, { exact: true }).check();
  faculty.once("dialog", (dialog) => dialog.accept());
  await faculty.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(
    faculty.getByText("Approved", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    faculty.getByText("+75 verified points", { exact: true }),
  ).toBeVisible();
  const duplicate = await faculty.request.post(
    `${new URL(url).pathname}/review-does-not-exist`,
  );
  expect(duplicate.status()).toBe(404);
  const id = new URL(url).pathname.split("/").pop();
  const retried = await faculty.request.post(
    `/api/v1/submissions/${id}/review`,
    {
      headers: { Origin: "http://localhost:3000" },
      data: {
        action: "APPROVE",
        version: 0,
        checklist: [
          "Evidence is authentic and readable",
          "Student identity and achievement date match",
          "Category, level and result are accurate",
        ],
      },
    },
  );
  expect(retried.status()).toBe(409);
  await student.reload();
  await expect(
    student.getByText("Approved", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    student.getByText("+75 verified points", { exact: true }),
  ).toBeVisible();
  const evidenceLink = student.getByRole("link", {
    name: "View ↗",
    exact: true,
  });
  const evidence = await student.request.get(
    (await evidenceLink.getAttribute("href")) || "",
  );
  expect(evidence.status()).toBe(200);
  expect(evidence.headers()["content-type"]).toBe("application/pdf");
  const forbidden = await student.request.post(
    `/api/v1/submissions/${id}/review`,
    {
      headers: { Origin: "http://localhost:3000" },
      data: { action: "APPROVE", version: 0, checklist: [] },
    },
  );
  expect(forbidden.status()).toBe(403);
  const csrf = await student.request.patch("/api/v1/profile", {
    headers: { Origin: "https://malicious.example" },
    data: { bio: "evil", portfolioPublic: true, leaderboardVisible: true },
  });
  expect(csrf.status()).toBe(403);
  await faculty.goto("/submissions");
  await faculty.screenshot({
    path: "docs/screenshots/faculty-queue.png",
    fullPage: true,
  });
  await student.goto("/dashboard");
  await student.setViewportSize({ width: 390, height: 844 });
  await student.screenshot({
    path: "docs/screenshots/student-mobile.png",
    fullPage: true,
  });
  expect(
    await student.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await studentContext.close();
  await facultyContext.close();
});
test("HOD and Admin use MFA and can view protected pages and reports", async ({
  browser,
}) => {
  for (const role of ["hod", "admin"]) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await login(page, role);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.screenshot({
      path: `docs/screenshots/${role}-dashboard.png`,
      fullPage: true,
    });
    const csv = await page.request.get(
      "/api/v1/reports?format=csv&status=APPROVED",
    );
    expect(csv.status()).toBe(200);
    expect(await csv.text()).toContain("Points");
    if (role === "admin") {
      await page.goto("/admin");
      await expect(
        page.getByRole("heading", { name: "Create an account" }),
      ).toBeVisible();
      await page.goto("/audit");
      await expect(
        page.getByRole("heading", { name: "An accountable record." }),
      ).toBeVisible();
    } else {
      const denied = await page.request.get("/api/v1/audit");
      expect(denied.status()).toBe(403);
    }
    await ctx.close();
  }
});
test("unauthenticated APIs require login", async ({ request }) => {
  const r = await request.get("/api/v1/submissions");
  expect(r.status()).toBe(401);
});
