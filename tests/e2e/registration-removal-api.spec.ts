import "../../src/lib/env";
import { test, expect, type APIRequestContext } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { db } from "../../src/lib/db";
import { assertLocalDemo } from "../../src/lib/demo";
import { demoOtp } from "./demo-otp";

const baseURL = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
async function signIn(client: APIRequestContext, role: "ADMIN" | "STUDENT") {
  expect(
    await loginUrl(
      client,
      `${role.toLowerCase()}@atria.edu`,
      process.env.DEMO_PASSWORD!,
      role === "ADMIN" ? demoOtp(role) : "",
    ),
  ).toBe(`${baseURL}/dashboard`);
}
async function loginUrl(
  client: APIRequestContext,
  email: string,
  password: string,
  otp = "",
) {
  const { csrfToken } = await (await client.get("/api/auth/csrf")).json();
  const response = await client.post("/api/auth/callback/credentials", {
    form: {
      csrfToken,
      email,
      password,
      otp,
      callbackUrl: `${baseURL}/dashboard`,
    },
    headers: { "X-Auth-Return-Redirect": "1" },
  });
  return (await response.json()).url as string;
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

test("deactivated Student and Faculty accounts can be removed, disappear from lists and lose login access", async ({
  playwright,
}) => {
  test.setTimeout(90000);
  assertLocalDemo();
  expect(["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname)).toBe(
    true,
  );
  const admin = await playwright.request.newContext({
    baseURL,
    extraHTTPHeaders: { Origin: baseURL },
  });
  const owner = await playwright.request.newContext({
    baseURL,
    extraHTTPHeaders: { Origin: baseURL },
  });
  const fixtureIds: string[] = [];
  try {
    await signIn(admin, "ADMIN");
    const department = await db.department.findUniqueOrThrow({
      where: { code: "CSE" },
    });
    for (const role of ["STUDENT", "FACULTY"] as const) {
      const password = "SyntheticDeactivate1!";
      const target = await db.user.create({
        data: {
          name: `SyntheticDeactivate-${randomUUID()}`,
          email: `http-deactivate-${randomUUID()}@atria.edu`,
          usn: role === "STUDENT" ? `DEACTIVATE-${randomUUID()}` : null,
          role,
          departmentId: department.id,
          passwordHash: await hash(password, 4),
          status: "ACTIVE",
          emailVerified: true,
        },
      });
      fixtureIds.push(target.id);
      const url = `/api/v1/admin/users/${target.id}`,
        payload = { email: target.email, status: "INACTIVE" };
      expect(await loginUrl(owner, target.email, password)).toBe(
        `${baseURL}/dashboard`,
      );
      expect((await owner.get("/api/v1/session")).status()).toBe(200);
      expect((await owner.delete(url, { data: payload })).status()).toBe(403);
      expect((await admin.delete(url, { data: payload })).status()).toBe(409);
      expect(
        (await admin.patch(url, { data: { status: "INACTIVE" } })).status(),
      ).toBe(200);
      expect((await owner.get("/api/v1/session")).status()).toBe(401);
      expect(
        await (
          await admin.get(`/admin?q=${encodeURIComponent(target.email)}`)
        ).text(),
      ).toContain("Remove account");
      expect(
        (
          await admin.delete(url, {
            data: payload,
            headers: { Origin: "https://evil.example" },
          })
        ).status(),
      ).toBe(403);
      expect(
        (
          await admin.delete(url, {
            data: { ...payload, email: "wrong@atria.edu" },
          })
        ).status(),
      ).toBe(409);
      expect((await admin.delete(url, { data: payload })).status()).toBe(200);
      expect(
        (await db.user.findUniqueOrThrow({ where: { id: target.id } }))
          .removedAt,
      ).not.toBeNull();
      expect(
        await db.user.findUnique({ where: { email: target.email } }),
      ).toBeNull();
      const filtered = await admin.get(
        `/admin?q=${encodeURIComponent(target.name)}`,
      );
      expect(await filtered.text()).not.toContain(
        `<strong>${target.name}</strong>`,
      );
      expect(
        await (await admin.get("/api/v1/admin/users")).text(),
      ).not.toContain(target.name);
      const search = (
        await (
          await admin.get(`/api/v1/search?q=${encodeURIComponent(target.name)}`)
        ).json()
      ).data;
      expect(
        [...search.students, ...search.faculty].map(
          (u: { id: string }) => u.id,
        ),
      ).not.toContain(target.id);
      expect(
        (await admin.patch(url, { data: { status: "ACTIVE" } })).status(),
      ).toBe(404);
      expect(await loginUrl(owner, target.email, password)).toContain(
        "error=CredentialsSignin",
      );
      expect((await admin.delete(url, { data: payload })).status()).toBe(404);
    }
  } finally {
    for (const id of fixtureIds) {
      const remaining = await db.user.findUnique({ where: { id } });
      if (remaining && !remaining.removedAt) {
        await admin.patch(`/api/v1/admin/users/${id}`, {
          data: { status: "INACTIVE" },
        });
        await admin.delete(`/api/v1/admin/users/${id}`, {
          data: { email: remaining.email, status: "INACTIVE" },
        });
      }
    }
    await admin.dispose();
    await owner.dispose();
    await db.$disconnect();
  }
});
