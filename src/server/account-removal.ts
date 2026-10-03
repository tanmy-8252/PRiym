import { db } from "@/lib/db";
import { assert } from "@/lib/errors";
import { OPEN_STATUSES } from "@/lib/rules";
import type { User } from "@/generated/prisma/client";
import { z } from "zod";
import { audit } from "./audit";
import { removeRegistrationRequest } from "./admin";

const removalSchema = z.object({
  email: z.email().toLowerCase(),
  status: z.enum(["PENDING", "INACTIVE"]).default("PENDING"),
});

export async function removeAccount(actor: User, id: string, raw: unknown) {
  assert(
    actor.role === "ADMIN",
    403,
    "FORBIDDEN",
    "Only administrators manage accounts.",
  );
  const { email, status } = removalSchema.parse(raw);
  if (status === "PENDING")
    return removeRegistrationRequest(actor, id, { email });
  assert(
    actor.id !== id,
    422,
    "SELF_EDIT",
    "You cannot remove your own account.",
  );
  return db.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${email}))`;
      const target = await tx.user.findUnique({ where: { id } });
      assert(
        target && !target.removedAt,
        404,
        "NOT_FOUND",
        "Account not found.",
      );
      assert(
        target.email === email,
        409,
        "ACCOUNT_CHANGED",
        "The account changed. Refresh and confirm it again.",
      );
      assert(
        target.status === "INACTIVE",
        409,
        "ACCOUNT_NOT_DEACTIVATED",
        "Deactivate this account before removing it.",
      );
      const now = new Date();
      // Conditional update prevents a concurrent reactivation from being removed.
      // Keep the user ID for achievements, reviews, points and audit references.
      const removed = await tx.user.updateMany({
        where: { id, email, status: "INACTIVE", removedAt: null },
        data: {
          removedAt: now,
          email: `removed-${id}@accounts.invalid`,
          usn: null,
          passwordHash: "",
          emailVerified: false,
          mfaSecret: null,
          pendingMfaSecret: null,
          lastTotpStep: null,
          failedAttempts: 0,
          lockedUntil: null,
          mentorId: null,
          portfolioPublic: false,
          leaderboardVisible: false,
          emailPreferences: [],
          bio: "",
          phone: "",
          linkedIn: "",
          github: "",
          officeHours: "",
          expertise: "",
        },
      });
      assert(
        removed.count === 1,
        409,
        "ACCOUNT_CHANGED",
        "The account changed. Refresh the approval panel.",
      );
      await tx.authSession.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: now },
      });
      await tx.accountToken.deleteMany({ where: { userId: id } });
      await tx.passwordHistory.deleteMany({ where: { userId: id } });
      await tx.mfaRecoveryCode.deleteMany({ where: { userId: id } });
      await tx.notification.deleteMany({ where: { userId: id } });
      await tx.savedFilter.deleteMany({ where: { userId: id } });
      await tx.reportSchedule.updateMany({
        where: { userId: id },
        data: { active: false },
      });
      await tx.$executeRaw`UPDATE "ReportSchedule" SET "recipients" = array_remove("recipients", ${email}) WHERE ${email} = ANY("recipients")`;
      await tx.reportJob.updateMany({
        where: { userId: id, status: "PENDING" },
        data: {
          status: "CANCELLED",
          error: "Account removed by an administrator.",
        },
      });
      await tx.mailOutbox.updateMany({
        where: { recipient: email, status: { in: ["PENDING", "FAILED"] } },
        data: {
          status: "CANCELLED",
          lastError: "Account removed by an administrator.",
        },
      });
      await tx.user.updateMany({
        where: { mentorId: id },
        data: { mentorId: null },
      });
      await tx.department.updateMany({
        where: { defaultVerifierId: id },
        data: { defaultVerifierId: null },
      });
      await tx.category.updateMany({
        where: { verifierId: id },
        data: { verifierId: null },
      });
      const reviews = await tx.submission.updateMany({
        where: {
          reviewerId: id,
          status: { in: [...OPEN_STATUSES, "CLARIFICATION_REQUESTED"] },
        },
        data: {
          reviewerId: null,
          escalated: true,
          escalationReason:
            "Assigned account was removed. HOD reassignment required.",
          escalatedAt: now,
          version: { increment: 1 },
        },
      });
      await audit(tx, actor, "ACCOUNT_REMOVED", "User", id, {
        name: target.name,
        email,
        usn: target.usn,
        role: target.role,
        departmentId: target.departmentId,
        previousStatus: target.status,
        academicHistoryRetained: true,
        reviewsEscalated: reviews.count,
      });
      return { ok: true };
    },
    { timeout: 15000 },
  );
}
