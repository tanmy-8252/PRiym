import { db } from "@/lib/db";
import { assert } from "@/lib/errors";
import { passwordSchema, userSchema } from "@/lib/validation";
import { randomBytes, createHash } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { totp as authenticator } from "@/lib/totp";
import { encrypt, decrypt } from "@/lib/crypto";
import type { Prisma, User } from "@/generated/prisma/client";
import { audit } from "./audit";
import { queueMail } from "./mail";
import { z } from "zod";
import { registrationAvailable } from "./registration-setup";
import { mailConfiguration } from "@/lib/mail-config";
type ScheduleMail = (messageIds: string[]) => void;
export const tokenDigest = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function issueToken(
  tx: Prisma.TransactionClient,
  user: User,
  purpose: "VERIFY" | "RESET",
) {
  const raw = randomBytes(32).toString("hex");
  await tx.accountToken.updateMany({
    where: { userId: user.id, purpose, usedAt: null },
    data: { usedAt: new Date() },
  });
  await tx.accountToken.create({
    data: {
      userId: user.id,
      purpose,
      digest: tokenDigest(raw),
      expiresAt: new Date(
        Date.now() + (purpose === "VERIFY" ? 24 : 1) * 3600_000,
      ),
    },
  });
  const url = `${process.env.AUTH_URL || "http://localhost:3000"}/account?mode=${purpose.toLowerCase()}&token=${raw}`;
  return queueMail(
    tx,
    user.email,
    purpose === "VERIFY"
      ? "Verify your PRiym email"
      : "Reset your PRiym password",
    `Hello ${user.name},\n\n${purpose === "VERIFY" ? "Verify your institutional email" : "Choose a new password"} using this single-use link:\n${url}\n\nExpires in ${purpose === "VERIFY" ? "24 hours" : "1 hour"}. If you did not request this, ignore this message.`,
  );
}
export async function register(raw: unknown, scheduleMail?: ScheduleMail) {
  const d = userSchema.parse(raw);
  assert(
    ["STUDENT", "FACULTY"].includes(d.role),
    422,
    "ROLE_PROVISIONING",
    "HOD and Admin accounts must be provisioned by an administrator.",
  );
  assert(
    (process.env.INSTITUTION_DOMAINS || "atria.edu,atria.edu.in")
      .split(",")
      .map((x) => x.trim())
      .includes(d.email.split("@")[1]),
    422,
    "DOMAIN",
    "Use an approved institutional email.",
  );
  assert(
    await registrationAvailable(),
    503,
    "REGISTRATION_UNAVAILABLE",
    "Registration will open once institution setup is complete. Please contact your administrator.",
  );
  const messageIds: string[] = [];
  const result = await db.$transaction(async (tx) => {
    assert(
      await tx.department.findUnique({ where: { id: d.departmentId } }),
      422,
      "DEPARTMENT",
      "Choose an existing department.",
    );
    const user = await tx.user.create({
      data: {
        name: d.name,
        email: d.email,
        usn: d.usn,
        batchYear: d.batchYear,
        departmentId: d.departmentId,
        role: d.role,
        passwordHash: await hash(d.password, 12),
      },
    });
    messageIds.push((await issueToken(tx, user, "VERIFY")).id);
    await audit(tx, user, "REGISTERED", "User", user.id);
    return {
      message:
        "Check your email to verify your address. An administrator must then approve your account before you can sign in.",
    };
  });
  scheduleMail?.(messageIds);
  return result;
}
export async function requestAccountLink(
  raw: unknown,
  scheduleMail?: ScheduleMail,
) {
  const d = z
    .object({
      email: z.email().toLowerCase(),
      purpose: z.enum(["VERIFY", "RESET"]),
    })
    .parse(raw);
  assert(
    mailConfiguration(),
    503,
    "EMAIL_UNAVAILABLE",
    "Email delivery is temporarily unavailable. Please contact your administrator.",
  );
  const messageId = await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${d.email}))`;
    const u = await tx.user.findUnique({ where: { email: d.email } });
    if (
      !u ||
      u.status === "INACTIVE" ||
      (d.purpose === "VERIFY" && u.emailVerified)
    )
      return;
    const recent = await tx.accountToken.findFirst({
      where: {
        userId: u.id,
        purpose: d.purpose,
        createdAt: { gt: new Date(Date.now() - 60_000) },
      },
    });
    if (!recent) return (await issueToken(tx, u, d.purpose)).id;
  });
  scheduleMail?.(messageId ? [messageId] : []);
  return {
    message:
      "If an eligible account exists, an email has been queued. Check your inbox.",
  };
}
export async function consumeAccountToken(
  raw: unknown,
  scheduleMail?: ScheduleMail,
) {
  const d = z
    .object({
      token: z.string().regex(/^[a-f0-9]{64}$/),
      purpose: z.enum(["VERIFY", "RESET"]),
      password: z.string().optional(),
    })
    .parse(raw);
  const messageIds: string[] = [];
  const result = await db.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${d.token}))`;
      const t = await tx.accountToken.findUnique({
        where: { digest: tokenDigest(d.token) },
        include: { user: true },
      });
      assert(
        t && t.purpose === d.purpose && !t.usedAt && t.expiresAt > new Date(),
        422,
        "INVALID_TOKEN",
        "This link is invalid or expired. Request a new one.",
      );
      if (d.purpose === "RESET") {
        const p = passwordSchema.parse(d.password);
        const history = await tx.passwordHistory.findMany({
          where: { userId: t.userId },
          orderBy: { createdAt: "desc" },
          take: 4,
        });
        for (const h of [{ hash: t.user.passwordHash }, ...history])
          assert(
            !(await compare(p, h.hash)),
            422,
            "PASSWORD_REUSE",
            "Do not reuse your last five passwords.",
          );
        await tx.passwordHistory.create({
          data: { userId: t.userId, hash: t.user.passwordHash },
        });
        await tx.user.update({
          where: { id: t.userId },
          data: {
            passwordHash: await hash(p, 12),
            failedAttempts: 0,
            lockedUntil: null,
          },
        });
        await tx.authSession.updateMany({
          where: { userId: t.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        await tx.accountToken.updateMany({
          where: { userId: t.userId, purpose: "RESET", usedAt: null },
          data: { usedAt: new Date() },
        });
        const mail = await queueMail(
          tx,
          t.user.email,
          "Your PRiym password was changed",
          "Your password was reset and all active sessions were signed out. Contact your administrator if you did not do this.",
        );
        messageIds.push(mail.id);
      } else
        await tx.user.update({
          where: { id: t.userId },
          data: { emailVerified: true },
        });
      await tx.accountToken.update({
        where: { id: t.id },
        data: { usedAt: new Date() },
      });
      await audit(
        tx,
        t.user,
        d.purpose === "VERIFY" ? "EMAIL_VERIFIED" : "PASSWORD_RESET",
        "User",
        t.userId,
      );
      return {
        message:
          d.purpose === "VERIFY"
            ? "Email verified. Sign in after your administrator approves your account."
            : "Password reset. You can now sign in with your new password.",
      };
    },
    { timeout: 15000 },
  );
  scheduleMail?.(messageIds);
  return result;
}
export async function manageMfa(u: User, raw: unknown) {
  const d = z
    .object({
      action: z.enum(["BEGIN", "CONFIRM", "DISABLE", "RECOVERY"]),
      password: z.string(),
      otp: z.string().optional(),
    })
    .parse(raw);
  assert(
    await compare(d.password, u.passwordHash),
    422,
    "PASSWORD",
    "Your current password is incorrect.",
  );
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${u.id}))`;
    const user = await tx.user.findUniqueOrThrow({ where: { id: u.id } });
    if (d.action === "BEGIN") {
      assert(
        !user.mfaSecret,
        409,
        "MFA_ENABLED",
        "MFA is already enabled. Disable it before replacing the authenticator.",
      );
      const secret = authenticator.generateSecret();
      await tx.user.update({
        where: { id: u.id },
        data: { pendingMfaSecret: encrypt(secret) },
      });
      return { secret, uri: authenticator.keyuri(u.email, "PRiym", secret) };
    }
    const secret =
      d.action === "CONFIRM" ? user.pendingMfaSecret : user.mfaSecret;
    assert(
      secret &&
        /^\d{6}$/.test(d.otp || "") &&
        authenticator.check(d.otp!, decrypt(secret)),
      422,
      "OTP",
      "Enter a valid authenticator code.",
    );
    if (d.action === "DISABLE") {
      assert(
        !["HOD", "ADMIN"].includes(u.role),
        422,
        "MFA_REQUIRED",
        "MFA is mandatory for your role.",
      );
      await tx.user.update({
        where: { id: u.id },
        data: { mfaSecret: null, lastTotpStep: null },
      });
      await tx.mfaRecoveryCode.deleteMany({ where: { userId: u.id } });
      await audit(tx, u, "MFA_DISABLED", "User", u.id);
      return { ok: true };
    }
    const codes = Array.from(
      { length: 8 },
      () => `R-${randomBytes(8).toString("hex")}`,
    );
    await tx.mfaRecoveryCode.deleteMany({ where: { userId: u.id } });
    await tx.mfaRecoveryCode.createMany({
      data: codes.map((c) => ({ userId: u.id, digest: tokenDigest(c) })),
    });
    if (d.action === "CONFIRM")
      await tx.user.update({
        where: { id: u.id },
        data: { mfaSecret: secret, pendingMfaSecret: null, lastTotpStep: null },
      });
    await audit(
      tx,
      u,
      d.action === "CONFIRM" ? "MFA_ENABLED" : "MFA_RECOVERY_REGENERATED",
      "User",
      u.id,
    );
    return { recoveryCodes: codes };
  });
}
