import { db } from "@/lib/db";
import { compare } from "bcryptjs";
import { verifyTotp, totpStep } from "@/lib/totp";
import { decrypt } from "@/lib/crypto";
import { audit } from "./audit";
import { tokenDigest } from "./account";
import { z } from "zod";
const credentialsSchema = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(1).max(72),
  otp: z.string().default(""),
  remember: z.string().optional(),
});
export async function authenticate(raw: unknown, request?: Request) {
  const parsed = credentialsSchema.safeParse(raw);
  if (!parsed.success) return null;
  const c = parsed.data;
  // Serialize login attempts for this email, including across app instances.
  return db.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${c.email}))`;
      const user = await tx.user.findUnique({ where: { email: c.email } });
      if (!user) {
        await compare(
          c.password,
          "$2b$12$AJrW8cuuDxmpTOZFEl.PQ.Xf/MIF/igGPbfBgVcIpGYGFkTkNWszm",
        );
        return null;
      }
      if (
        user.status !== "ACTIVE" ||
        user.removedAt ||
        !user.emailVerified ||
        (user.lockedUntil && user.lockedUntil > new Date())
      )
        return null;
      let valid = await compare(c.password, user.passwordHash);
      const mfaRequired =
        ["HOD", "ADMIN"].includes(user.role) || !!user.mfaSecret;
      const epoch = Date.now();
      const step = totpStep(epoch);
      if (mfaRequired)
        valid =
          valid &&
          !!user.mfaSecret &&
          /^\d{6}$/.test(c.otp) &&
          verifyTotp(c.otp, decrypt(user.mfaSecret!), epoch) &&
          user.lastTotpStep !== step;
      if (
        mfaRequired &&
        !valid &&
        c.otp.startsWith("R-") &&
        (await compare(c.password, user.passwordHash))
      ) {
        const recovery = await tx.mfaRecoveryCode.updateMany({
          where: { userId: user.id, digest: tokenDigest(c.otp), usedAt: null },
          data: { usedAt: new Date() },
        });
        valid = recovery.count === 1;
      }
      if (!valid) {
        const attempts =
          (user.lockedUntil && user.lockedUntil < new Date()
            ? 0
            : user.failedAttempts) + 1;
        await tx.user.update({
          where: { id: user.id },
          data: {
            failedAttempts: attempts,
            lockedUntil:
              attempts >= 5 ? new Date(Date.now() + 30 * 60_000) : null,
          },
        });
        await audit(tx, user, "LOGIN_FAILED", "User", user.id, {
          locked: attempts >= 5,
        });
        return null;
      }
      await tx.user.update({
        where: { id: user.id },
        data: {
          failedAttempts: 0,
          lockedUntil: null,
          ...(mfaRequired ? { lastTotpStep: step } : {}),
        },
      });
      const session = await tx.authSession.create({
        data: {
          userId: user.id,
          userAgent: request?.headers.get("user-agent")?.slice(0, 300) || "",
          ipAddress:
            request?.headers
              .get("x-forwarded-for")
              ?.split(",")[0]
              ?.slice(0, 64) || "",
          expiresAt: new Date(
            Date.now() + (c.remember === "true" ? 30 * 24 : 8) * 3600_000,
          ),
        },
      });
      await audit(tx, user, "LOGIN", "AuthSession", session.id);
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        sessionId: session.id,
      };
    },
    { timeout: 15000 },
  );
}
