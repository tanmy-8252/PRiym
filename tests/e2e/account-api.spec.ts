import "../../src/lib/env";
import { test, expect, type APIRequestContext } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { db } from "../../src/lib/db";
import { assertLocalDemo } from "../../src/lib/demo";
const baseURL = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";

async function signIn(
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
  expect(response.status()).toBe(200);
  return response.json();
}

test("registration immediately delivers private verification mail, requires approval, then signs in", async ({
  playwright,
}) => {
  assertLocalDemo();
  expect(["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname)).toBe(
    true,
  );
  test.setTimeout(90000);
  const student = await playwright.request.newContext({
    baseURL,
    extraHTTPHeaders: { Origin: baseURL },
  });
  const admin = await playwright.request.newContext({
    baseURL,
    extraHTTPHeaders: { Origin: baseURL },
  });
  const email = `http-register-${randomUUID()}@atria.edu`,
    password = "SyntheticStudent1!";
  let userId: string | undefined;
  try {
    const department = await db.department.findUniqueOrThrow({
      where: { code: "CSE" },
    });
    const page = await student.get("/account?mode=register");
    expect(page.status()).toBe(200);
    expect(
      (await page.text()).includes(`<option value="${department.id}">`),
    ).toBe(true);
    const data = {
      action: "REGISTER",
      name: "Synthetic HTTP Student",
      email,
      password,
      departmentId: department.id,
      role: "STUDENT",
      usn: `1AT26CS${Math.floor(100 + Math.random() * 900)}`,
    };
    expect(
      (
        await student.post("/api/account", {
          data,
          headers: { Origin: "https://evil.example" },
        })
      ).status(),
    ).toBe(403);
    expect(await db.user.findUnique({ where: { email } })).toBeNull();
    const response = await student.post("/api/account", { data });
    expect(response.status()).toBe(200);
    const user = await db.user.findUniqueOrThrow({ where: { email } });
    userId = user.id;
    expect(user.status).toBe("PENDING");
    expect(user.emailVerified).toBe(false);
    await expect
      .poll(
        async () =>
          (await db.mailOutbox.findFirst({ where: { recipient: email } }))
            ?.status,
      )
      .toBe("SENT");
    const mail = await db.mailOutbox.findFirstOrThrow({
      where: { recipient: email },
    });
    const token = mail.body.match(/token=([a-f0-9]{64})/)![1];
    expect(
      (
        await student.post("/api/account", {
          data: { token, purpose: "VERIFY" },
        })
      ).status(),
    ).toBe(200);
    expect((await signIn(student, email, password)).url).toContain(
      "error=CredentialsSignin",
    );
    expect(
      (await (await student.get("/api/auth/session")).json())?.user,
    ).toBeUndefined();
    const codes = JSON.parse(
      execFileSync(
        process.execPath,
        ["--import", "tsx", "scripts/demo-otp.ts", "--role", "ADMIN", "--json"],
        { encoding: "utf8", timeout: 40000 },
      ),
    );
    expect(
      (
        await signIn(
          admin,
          "admin@atria.edu",
          process.env.DEMO_PASSWORD!,
          codes.codes[0].code,
        )
      ).url,
    ).toBe(`${baseURL}/dashboard`);
    expect(
      (
        await admin.patch(`/api/v1/admin/users/${user.id}`, {
          data: { status: "ACTIVE" },
        })
      ).status(),
    ).toBe(200);
    expect((await signIn(student, email, password)).url).toBe(
      `${baseURL}/dashboard`,
    );
    expect(
      (await (await student.get("/api/auth/session")).json()).user.email,
    ).toBe(email);
    expect(
      (await student.get("/dashboard", { maxRedirects: 0 })).status(),
    ).toBe(200);
  } finally {
    // Preserve audit history but leave this synthetic local account inactive.
    if (userId)
      await admin.patch(`/api/v1/admin/users/${userId}`, {
        data: { status: "INACTIVE" },
      });
    await student.dispose();
    await admin.dispose();
    await db.$disconnect();
  }
});
