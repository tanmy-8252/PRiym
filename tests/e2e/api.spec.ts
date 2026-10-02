import { randomUUID } from "node:crypto";
import { test, expect, APIRequestContext } from "@playwright/test";
import { authenticator } from "otplib";
import { PDFDocument } from "pdf-lib";
async function signIn(request: APIRequestContext, role: string) {
  const csrf = await (await request.get("/api/auth/csrf")).json();
  const response = await request.post("/api/auth/callback/credentials", {
    form: {
      csrfToken: csrf.csrfToken,
      email: `${role}@atria.edu`,
      password: process.env.DEMO_PASSWORD || "PriymDemo1!",
      otp: ["hod", "admin"].includes(role)
        ? authenticator.generate(process.env.DEMO_TOTP_SECRET!)
        : "",
      callbackUrl: "http://localhost:3000/dashboard",
    },
    headers: { "X-Auth-Return-Redirect": "1" },
  });
  expect(response.status()).toBe(200);
  const me = await request.get("/api/v1/submissions");
  if (me.status() === 401 && ["hod", "admin"].includes(role)) {
    // A preceding test may have consumed the current one-time TOTP interval.
    await new Promise((resolve) =>
      setTimeout(resolve, 30000 - (Date.now() % 30000) + 150),
    );
    const next = await (await request.get("/api/auth/csrf")).json();
    await request.post("/api/auth/callback/credentials", {
      form: {
        csrfToken: next.csrfToken,
        email: `${role}@atria.edu`,
        password: process.env.DEMO_PASSWORD || "PriymDemo1!",
        otp: authenticator.generate(process.env.DEMO_TOTP_SECRET!),
        callbackUrl: "http://localhost:3000/dashboard",
      },
      headers: { "X-Auth-Return-Redirect": "1" },
    });
    expect((await request.get("/api/v1/submissions")).status()).toBe(200);
  } else expect(me.status()).toBe(200);
}
test("live HTTP vertical slice, evidence, decisions, role checks and reports", async ({
  playwright,
}) => {
  const options = {
    baseURL: "http://localhost:3000",
    extraHTTPHeaders: { Origin: "http://localhost:3000" },
  };
  const student = await playwright.request.newContext(options),
    faculty = await playwright.request.newContext(options),
    hod = await playwright.request.newContext(options);
  await signIn(student, "student");
  await signIn(faculty, "faculty");
  const existing = (await (await student.get("/api/v1/submissions")).json())
    .data;
  const categoryId = existing.find(
    (s: { category: { name: string } }) => s.category.name === "Certifications",
  ).categoryId;
  const pdf = await PDFDocument.create();
  pdf.addPage().drawText("Synthetic live HTTP evidence");
  const upload = await student.post(
    "/api/v1/evidence?name=live-http-proof.pdf",
    {
      data: Buffer.from(await pdf.save()),
      headers: { "Content-Type": "application/pdf" },
    },
  );
  expect(upload.status()).toBe(200);
  const evidenceId = (await upload.json()).data.id;
  const submit = await student.post("/api/v1/submissions", {
    data: {
      title: `HTTP award ${randomUUID()}`,
      description:
        "An achievement submitted through the running app to test the complete workflow.",
      organization: "Test Institute",
      categoryId,
      level: "NATIONAL",
      achievementDate: new Date().toISOString().slice(0, 10),
      evidenceIds: [evidenceId],
    },
  });
  expect(submit.status()).toBe(200);
  const id = (await submit.json()).data.id;
  const detail = (await (await faculty.get(`/api/v1/submissions/${id}`)).json())
    .data;
  expect(detail.student.passwordHash).toBeUndefined();
  expect(detail.student.email).toBeUndefined();
  const approve = await faculty.post(`/api/v1/submissions/${id}/review`, {
    data: {
      action: "APPROVE",
      version: 0,
      checklist: detail.checklistSnapshot,
    },
  });
  expect(approve.status()).toBe(200);
  expect((await approve.json()).data.pointsAwarded).toBe(75);
  const retried = await faculty.post(`/api/v1/submissions/${id}/review`, {
    data: {
      action: "APPROVE",
      version: 0,
      checklist: detail.checklistSnapshot,
    },
  });
  expect(retried.status()).toBe(409);
  const status = (await (await student.get(`/api/v1/submissions/${id}`)).json())
    .data;
  expect(status.status).toBe("APPROVED");
  expect(status.pointsAwarded).toBe(75);
  const evidence = await student.get(`/api/v1/evidence/${evidenceId}`);
  expect(evidence.status()).toBe(200);
  expect(evidence.headers()["content-type"]).toBe("application/pdf");
  expect(
    (
      await student.post(`/api/v1/submissions/${id}/review`, {
        data: { action: "APPROVE", version: 0, checklist: [] },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await student.patch("/api/v1/profile", {
        headers: { Origin: "https://malicious.example" },
        data: { bio: "x", portfolioPublic: true, leaderboardVisible: true },
      })
    ).status(),
  ).toBe(403);
  expect((await student.get("/api/v1/audit")).status()).toBe(403);
  const report = await student.get("/api/v1/reports?format=pdf");
  expect(report.status()).toBe(200);
  expect((await report.body()).subarray(0, 5).toString()).toBe("%PDF-");
  for (const path of [
    "/dashboard",
    "/submissions",
    "/leaderboard",
    "/reports",
    "/notifications",
    "/profile",
  ]) {
    expect((await student.get(path)).status()).toBe(200);
  }
  await signIn(hod, "hod");
  expect((await hod.get("/dashboard")).status()).toBe(200);
  expect((await hod.get("/settings")).status()).toBe(200);
  expect((await hod.get("/api/v1/audit")).status()).toBe(403);
  await student.dispose();
  await faculty.dispose();
  await hod.dispose();
});
