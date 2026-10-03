import "../../src/lib/env";
import { test, expect, type APIRequestContext } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { db } from "../../src/lib/db";
import { assertLocalDemo } from "../../src/lib/demo";
import { demoOtp } from "./demo-otp";

const baseURL = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
async function signIn(client: APIRequestContext, role: "ADMIN" | "STUDENT") {
  const { csrfToken } = await (await client.get("/api/auth/csrf")).json();
  const response = await client.post("/api/auth/callback/credentials", {
    form: {
      csrfToken,
      email: `${role.toLowerCase()}@atria.edu`,
      password: process.env.DEMO_PASSWORD!,
      otp: role === "ADMIN" ? demoOtp(role) : "",
      callbackUrl: `${baseURL}/dashboard`,
    },
    headers: { "X-Auth-Return-Redirect": "1" },
  });
  expect((await response.json()).url).toBe(`${baseURL}/dashboard`);
}

test("Admin removes a synthetic pending request through the protected HTTP route", async ({
  playwright,
}) => {
  assertLocalDemo();
  expect(["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname)).toBe(
    true,
  );
  const admin = await playwright.request.newContext({
    baseURL,
    extraHTTPHeaders: { Origin: baseURL },
  });
  const student = await playwright.request.newContext({
    baseURL,
    extraHTTPHeaders: { Origin: baseURL },
  });
  let targetId: string | undefined;
  try {
    await signIn(admin, "ADMIN");
    await signIn(student, "STUDENT");
    const department = await db.department.findUniqueOrThrow({
      where: { code: "CSE" },
    });
    const target = await db.user.create({
      data: {
        name: "Synthetic Removal Request",
        email: `http-remove-${randomUUID()}@atria.edu`,
        usn: `REMOVE-${randomUUID()}`,
        role: "STUDENT",
        departmentId: department.id,
        passwordHash: await hash("SyntheticRemoval1!", 4),
        status: "PENDING",
      },
    });
    targetId = target.id;
    const url = `/api/v1/admin/users/${target.id}`;
    expect(
      (await student.delete(url, { data: { email: target.email } })).status(),
    ).toBe(403);
    expect(
      (
        await admin.delete(url, {
          data: { email: target.email },
          headers: { Origin: "https://evil.example" },
        })
      ).status(),
    ).toBe(403);
    const page = await admin.get(
      `/admin?q=${encodeURIComponent(target.email)}`,
    );
    expect(page.status()).toBe(200);
    expect(await page.text()).toContain("Remove request");
    expect(
      (
        await admin.delete(url, { data: { email: "mismatch@atria.edu" } })
      ).status(),
    ).toBe(409);
    const removed = await admin.delete(url, { data: { email: target.email } });
    expect(removed.status()).toBe(200);
    expect((await removed.json()).data.ok).toBe(true);
    expect(await db.user.findUnique({ where: { id: target.id } })).toBeNull();
    expect(
      await (
        await admin.get(`/admin?q=${encodeURIComponent(target.email)}`)
      ).text(),
    ).not.toContain(target.email + " ·");
    const active = await db.user.findUniqueOrThrow({
      where: { email: "student@atria.edu" },
    });
    expect(
      (
        await admin.delete(`/api/v1/admin/users/${active.id}`, {
          data: { email: active.email },
        })
      ).status(),
    ).toBe(409);
    expect(
      (await db.user.findUniqueOrThrow({ where: { id: active.id } })).status,
    ).toBe("ACTIVE");
    expect(
      (await admin.delete(url, { data: { email: target.email } })).status(),
    ).toBe(404);
  } finally {
    if (targetId) {
      const remaining = await db.user.findUnique({ where: { id: targetId } });
      if (remaining)
        await admin.delete(`/api/v1/admin/users/${targetId}`, {
          data: { email: remaining.email },
        });
    }
    await admin.dispose();
    await student.dispose();
    await db.$disconnect();
  }
});
