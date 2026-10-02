import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { compare, hash } from "bcryptjs";
import { db } from "@/lib/db";
import { resetDemoAccounts } from "@/server/demo-accounts";
import { authenticate } from "@/server/authentication";
import { demoAccounts } from "@/lib/demo";
import { decrypt } from "@/lib/crypto";
import { generateTotp, totpStep } from "@/lib/totp";
const password = "CustomDemo9!",
  secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
beforeAll(() => {
  vi.stubEnv("SEED_DEMO", "true");
  vi.stubEnv("DEMO_PASSWORD", password);
  vi.stubEnv("DEMO_TOTP_SECRET", secret);
});
afterAll(async () => {
  vi.unstubAllEnvs();
  await db.$disconnect();
});
describe("clean local demo accounts", () => {
  it("repairs existing credentials, approval, roles, lockouts and unreadable MFA without changing account IDs/data", async () => {
    await resetDemoAccounts();
    const student = await db.user.findUniqueOrThrow({
      where: { email: demoAccounts[0].email },
    });
    const faculty = await db.user.findUniqueOrThrow({
      where: { email: demoAccounts[1].email },
    });
    const evidence = await db.evidence.create({
      data: {
        ownerId: student.id,
        fileName: "preserved.pdf",
        mimeType: "application/pdf",
        sizeBytes: 10,
        sha256: "b".repeat(64),
        storageKey: `demo/${student.id}/preserved`,
        scanStatus: "CLEAN",
      },
    });
    const session = await authenticate({ email: faculty.email, password });
    await db.user.updateMany({
      where: { email: { in: demoAccounts.map((a) => a.email) } },
      data: {
        passwordHash: await hash("StalePass1!", 4),
        status: "PENDING",
        emailVerified: false,
        failedAttempts: 5,
        lockedUntil: new Date(Date.now() + 1800000),
        mfaSecret: "unreadable-with-current-auth-key",
        pendingMfaSecret: "stale",
        lastTotpStep: totpStep(),
      },
    });
    await db.user.update({
      where: { id: faculty.id },
      data: { role: "STUDENT" },
    });
    await resetDemoAccounts();
    expect(
      (await db.user.findUniqueOrThrow({ where: { email: student.email } })).id,
    ).toBe(student.id);
    expect(
      await db.evidence.findUnique({ where: { id: evidence.id } }),
    ).not.toBeNull();
    expect(
      (
        await db.authSession.findUniqueOrThrow({
          where: { id: session!.sessionId },
        })
      ).revokedAt,
    ).not.toBeNull();
    for (const account of demoAccounts) {
      const u = await db.user.findUniqueOrThrow({
        where: { email: account.email },
      });
      expect(u.role).toBe(account.role);
      expect(u.status).toBe("ACTIVE");
      expect(u.emailVerified).toBe(true);
      expect(u.failedAttempts).toBe(0);
      expect(u.lockedUntil).toBeNull();
      expect(u.pendingMfaSecret).toBeNull();
      expect(u.lastTotpStep).toBeNull();
      expect(await compare(password, u.passwordHash)).toBe(true);
      expect(u.passwordHash).not.toBe(password);
      expect(u.mfaSecret ? decrypt(u.mfaSecret) : null).toBe(
        ["HOD", "ADMIN"].includes(account.role) ? secret : null,
      );
    }
  });
  it("authenticates all four roles with the configured password and exact seeded MFA; rejects replay and missing codes", async () => {
    await resetDemoAccounts();
    for (const account of demoAccounts) {
      const mfa = ["HOD", "ADMIN"].includes(account.role);
      if (mfa)
        expect(
          await authenticate({ email: account.email, password }),
        ).toBeNull();
      const otp = mfa ? generateTotp(secret) : "";
      const result = await authenticate({
        email: account.email,
        password,
        otp,
      });
      expect(result?.id).toBeTruthy();
      expect(result?.sessionId).toBeTruthy();
      expect(
        (
          await db.authSession.findUniqueOrThrow({
            where: { id: result!.sessionId },
          })
        ).userId,
      ).toBe(result!.id);
      if (mfa)
        expect(
          await authenticate({ email: account.email, password, otp }),
        ).toBeNull();
    }
  });
  it("retains ordinary lockout and account approval protections", async () => {
    await resetDemoAccounts();
    const email = "student@atria.edu";
    for (let i = 0; i < 5; i++)
      expect(await authenticate({ email, password: "WrongPass1!" })).toBeNull();
    const locked = await db.user.findUniqueOrThrow({ where: { email } });
    expect(locked.failedAttempts).toBe(5);
    expect(locked.lockedUntil!.getTime()).toBeGreaterThan(Date.now());
    expect(await authenticate({ email, password })).toBeNull();
    await resetDemoAccounts();
    await db.user.update({ where: { email }, data: { status: "PENDING" } });
    expect(await authenticate({ email, password })).toBeNull();
    await resetDemoAccounts();
    expect(await authenticate({ email, password })).not.toBeNull();
  });
});
