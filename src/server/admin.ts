import { db } from "@/lib/db";
import { assert } from "@/lib/errors";
import { userSchema, categorySchema } from "@/lib/validation";
import { encrypt } from "@/lib/crypto";
import { hash } from "bcryptjs";
import type { User } from "@/generated/prisma/client";
import { audit } from "./audit";
import { issueToken } from "./account";
import { queueMail } from "./mail";
import { z } from "zod";
export async function createUser(actor: User, raw: unknown) {
  assert(
    actor.role === "ADMIN",
    403,
    "FORBIDDEN",
    "Only administrators manage accounts.",
  );
  const d = userSchema.parse(raw);
  const domains = (
    process.env.INSTITUTION_DOMAINS || "atria.edu,atria.edu.in"
  ).split(",");
  assert(
    domains.includes(d.email.split("@")[1]),
    422,
    "INVALID_EMAIL_DOMAIN",
    "Use an approved institutional email domain.",
  );
  const secret = (raw as { mfaSecret?: string }).mfaSecret;
  assert(
    !["HOD", "ADMIN"].includes(d.role) ||
      (!!secret && /^[A-Z2-7]{16,64}$/.test(secret)),
    422,
    "MFA_REQUIRED",
    "HOD/Admin accounts require an authenticator secret during provisioning.",
  );
  return db.$transaction(async (tx) => {
    const dept = await tx.department.findUnique({
      where: { id: d.departmentId },
    });
    assert(dept, 422, "INVALID_DEPARTMENT", "Choose an existing department.");
    const u = await tx.user.create({
      data: {
        name: d.name,
        email: d.email,
        passwordHash: await hash(d.password, 12),
        departmentId: d.departmentId,
        role: d.role,
        usn: d.usn,
        batchYear: d.batchYear,
        status: "PENDING",
        emailVerified: false,
        ...(secret ? { mfaSecret: encrypt(secret) } : {}),
      },
    });
    await issueToken(tx, u, "VERIFY");
    await audit(tx, actor, "USER_CREATED", "User", u.id, {
      role: u.role,
      status: u.status,
    });
    return { id: u.id, name: u.name };
  });
}
const updateSchema = z.object({
  status: z.enum(["ACTIVE", "PENDING", "INACTIVE"]).optional(),
  role: z.enum(["STUDENT", "FACULTY", "HOD", "ADMIN"]).optional(),
  mentorId: z.string().uuid().nullable().optional(),
});
export async function removeRegistrationRequest(
  actor: User,
  id: string,
  raw: unknown,
) {
  assert(
    actor.role === "ADMIN",
    403,
    "FORBIDDEN",
    "Only administrators manage accounts.",
  );
  const { email } = z.object({ email: z.email().toLowerCase() }).parse(raw);
  assert(
    actor.id !== id,
    422,
    "SELF_EDIT",
    "You cannot remove your own account.",
  );
  return db.$transaction(
    async (tx) => {
      // Share the authentication/account-link lock and recheck the account after it.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${email}))`;
      const target = await tx.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          usn: true,
          role: true,
          status: true,
          emailVerified: true,
          departmentId: true,
          _count: {
            select: {
              submissions: true,
              assigned: true,
              events: true,
              evidence: true,
              ledger: true,
              awards: true,
              badges: true,
              sessions: true,
              savedFilters: true,
              reportJobs: true,
              reportSchedules: true,
              honorRoll: true,
              mentees: true,
            },
          },
        },
      });
      assert(target, 404, "NOT_FOUND", "Registration request not found.");
      assert(
        target.email === email,
        409,
        "ACCOUNT_CHANGED",
        "The account changed. Refresh and confirm the request again.",
      );
      assert(
        target.status === "PENDING" &&
          ["STUDENT", "FACULTY"].includes(target.role),
        409,
        "NOT_PENDING_REGISTRATION",
        "Only pending Student or Faculty registration requests can be removed.",
      );
      const [
        priorActivation,
        departmentAssignments,
        categoryAssignments,
        conflicts,
        collaborators,
      ] = await Promise.all([
        tx.auditLog.count({
          where: {
            entityType: "User",
            entityId: id,
            action: "USER_UPDATED",
            OR: [
              { metadata: { path: ["before", "status"], equals: "ACTIVE" } },
              { metadata: { path: ["after", "status"], equals: "ACTIVE" } },
            ],
          },
        }),
        tx.department.count({ where: { defaultVerifierId: id } }),
        tx.category.count({ where: { verifierId: id } }),
        tx.conflictOfInterest.count({
          where: { OR: [{ studentId: id }, { facultyId: id }] },
        }),
        tx.submission.count({ where: { collaboratorIds: { has: id } } }),
      ]);
      assert(
        !Object.values(target._count).some(Boolean) &&
          ![
            priorActivation,
            departmentAssignments,
            categoryAssignments,
            conflicts,
            collaborators,
          ].some(Boolean),
        409,
        "ACCOUNT_HAS_ACTIVITY",
        "This account has previous activity and cannot be removed as a registration request.",
      );
      await tx.mailOutbox.updateMany({
        where: { recipient: email, status: { in: ["PENDING", "FAILED"] } },
        data: {
          status: "CANCELLED",
          lastError: "Registration request removed by an administrator.",
        },
      });
      await tx.accountToken.deleteMany({ where: { userId: id } });
      await tx.passwordHistory.deleteMany({ where: { userId: id } });
      await tx.mfaRecoveryCode.deleteMany({ where: { userId: id } });
      await tx.notification.deleteMany({ where: { userId: id } });
      // A concurrent approval must win rather than deleting an activated account.
      const removed = await tx.user.deleteMany({
        where: {
          id,
          email,
          status: "PENDING",
          role: { in: ["STUDENT", "FACULTY"] },
        },
      });
      assert(
        removed.count === 1,
        409,
        "ACCOUNT_CHANGED",
        "The account changed. Refresh the approval panel.",
      );
      await audit(tx, actor, "REGISTRATION_REMOVED", "User", id, {
        name: target.name,
        email: target.email,
        usn: target.usn,
        role: target.role,
        departmentId: target.departmentId,
        emailVerified: target.emailVerified,
      });
      return { ok: true };
    },
    { timeout: 15000 },
  );
}
export async function updateUser(actor: User, id: string, raw: unknown) {
  assert(
    actor.role === "ADMIN",
    403,
    "FORBIDDEN",
    "Only administrators manage accounts.",
  );
  const d = updateSchema.parse(raw);
  assert(
    actor.id !== id,
    422,
    "SELF_EDIT",
    "Use another administrator to change your own account role or activation.",
  );
  return db.$transaction(async (tx) => {
    const target = await tx.user.findUnique({ where: { id } });
    assert(target, 404, "NOT_FOUND", "Account not found.");
    const role = d.role || target.role;
    assert(
      !["HOD", "ADMIN"].includes(role) || target.mfaSecret,
      422,
      "MFA_REQUIRED",
      "Enable MFA before assigning an HOD/Admin role.",
    );
    assert(
      role !== "STUDENT" || target.usn,
      422,
      "USN_REQUIRED",
      "Only accounts with a USN can become students.",
    );
    if (d.mentorId) {
      const f = await tx.user.findFirst({
        where: {
          id: d.mentorId,
          role: "FACULTY",
          departmentId: target.departmentId,
          status: "ACTIVE",
        },
      });
      assert(
        f && role === "STUDENT",
        422,
        "INVALID_MENTOR",
        "Student mentors must be active faculty in the same department.",
      );
    }
    if (d.status === "ACTIVE")
      assert(
        target.emailVerified,
        422,
        "EMAIL_UNVERIFIED",
        "The user must verify their email before activation.",
      );
    await tx.user.update({ where: { id }, data: d });
    if (d.status === "ACTIVE" && target.status !== "ACTIVE")
      await queueMail(
        tx,
        target.email,
        "Your PRiym account is approved",
        `Hello ${target.name}, sign in at ${process.env.AUTH_URL}/login`,
      );
    await tx.authSession.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await audit(tx, actor, "USER_UPDATED", "User", id, {
      before: { role: target.role, status: target.status },
      after: d,
    });
    return { ok: true };
  });
}
export async function saveCategory(actor: User, raw: unknown, id?: string) {
  assert(
    actor.role === "ADMIN" || actor.role === "HOD",
    403,
    "FORBIDDEN",
    "Only Admin or HOD can configure categories.",
  );
  const d = categorySchema.parse(raw);
  return db.$transaction(async (tx) => {
    if (id) {
      const old = await tx.category.findUnique({ where: { id } });
      assert(old, 404, "NOT_FOUND", "Category not found.");
      assert(
        actor.role === "ADMIN" || old.departmentId === actor.departmentId,
        403,
        "FORBIDDEN",
        "This category belongs to another department.",
      );
      assert(
        actor.role === "ADMIN",
        403,
        "FORBIDDEN",
        "HOD can update category weights through department settings.",
      );
    } else
      assert(
        actor.role === "ADMIN",
        403,
        "FORBIDDEN",
        "Only administrators create categories.",
      );
    const c = id
      ? await tx.category.update({ where: { id }, data: d })
      : await tx.category.create({
          data: { ...d, departmentId: actor.departmentId },
        });
    await audit(
      tx,
      actor,
      id ? "CATEGORY_UPDATED" : "CATEGORY_CREATED",
      "Category",
      c.id,
      {
        basePoints: c.basePoints,
        multiplier: Number(c.multiplier),
        active: c.active,
      },
    );
    return { id: c.id };
  });
}
