import { beforeAll, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import type { User } from "@/generated/prisma/client";
import { removeAccount } from "@/server/account-removal";
import { createUser, updateUser } from "@/server/admin";
import { authenticate } from "@/server/authentication";
import { issueToken, consumeAccountToken } from "@/server/account";
import { dashboardData } from "@/server/analytics";
import { signAudit } from "@/lib/audit-signature";
import { queueNotificationEmail } from "@/server/mail";
import { encrypt } from "@/lib/crypto";
import { authenticator } from "otplib";

let admin: User,
  faculty: User,
  departmentId: string,
  categoryId: string,
  semesterId: string,
  passwordHash: string;
const suffix = randomUUID(),
  password = "SyntheticRemove1!";
async function account(overrides: Partial<User> = {}) {
  return db.user.create({
    data: {
      name: "Synthetic Existing Account",
      email: `inactive-${randomUUID()}@atria.edu`,
      usn: `INACTIVE-${randomUUID()}`,
      departmentId,
      passwordHash,
      role: "STUDENT",
      status: "ACTIVE",
      emailVerified: true,
      ...overrides,
    },
  });
}
async function submission(
  studentId: string,
  reviewerId: string,
  status: "APPROVED" | "SUBMITTED" | "CLARIFICATION_REQUESTED",
) {
  return db.submission.create({
    data: {
      title: "Retained achievement",
      description: "Synthetic institutional record",
      organization: "Test only",
      achievementDate: new Date("2026-09-01"),
      level: "COLLEGE",
      status,
      studentId,
      reviewerId,
      departmentId,
      categoryId,
      semesterId,
      pointsAwarded: status === "APPROVED" ? 40 : 0,
    },
  });
}
beforeAll(async () => {
  departmentId = (
    await db.department.create({
      data: { code: `I${suffix}`, name: "Inactive removal tests" },
    })
  ).id;
  passwordHash = await hash(password, 4);
  admin = await account({ role: "ADMIN", usn: null });
  faculty = await account({ role: "FACULTY", usn: null });
  categoryId = (
    await db.category.create({
      data: { name: `Removal ${suffix}`, description: "Test", basePoints: 40 },
    })
  ).id;
  semesterId = (
    await db.semester.create({
      data: {
        label: `Removal ${suffix}`,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
      },
    })
  ).id;
});
afterAll(() => db.$disconnect());

it("removes a previously used Student login without losing achievements, points, evidence or audit history", async () => {
  const student = await account({ usn: "1AT26AI973" });
  const login = await authenticate({ email: student.email, password });
  expect(login).not.toBeNull();
  const achievement = await submission(student.id, faculty.id, "APPROVED");
  const evidence = await db.evidence.create({
    data: {
      ownerId: student.id,
      submissionId: achievement.id,
      fileName: "test.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1,
      storageKey: randomUUID(),
      sha256: "a".repeat(64),
      scanStatus: "CLEAN",
    },
  });
  const points = await db.pointEntry.create({
    data: {
      userId: student.id,
      actorId: faculty.id,
      semesterId,
      submissionId: achievement.id,
      amount: 40,
      note: "Verified test",
    },
  });
  const badge = await db.badge.create({
    data: {
      name: `Retained ${randomUUID()}`,
      description: "Test",
      threshold: 40,
    },
  });
  await db.userBadge.create({
    data: { userId: student.id, badgeId: badge.id },
  });
  await db.honorRoll.create({
    data: { userId: student.id, semesterId, departmentId, rank: 1, points: 40 },
  });
  const mail = await db.$transaction((tx) => issueToken(tx, student, "RESET"));
  const token = mail.body.match(/token=([a-f0-9]{64})/)![1];
  await db.passwordHistory.create({
    data: { userId: student.id, hash: passwordHash },
  });
  await db.mfaRecoveryCode.create({
    data: { userId: student.id, digest: randomUUID() },
  });
  const schedule = await db.reportSchedule.create({
    data: {
      userId: student.id,
      query: "type=summary",
      frequency: "DAILY",
      nextRunAt: new Date(),
      recipients: [student.email],
    },
  });
  const job = await db.reportJob.create({
    data: { userId: student.id, query: "type=summary" },
  });
  await updateUser(admin, student.id, { status: "INACTIVE" });
  await removeAccount(admin, student.id, {
    email: student.email,
    status: "INACTIVE",
  });
  expect(
    await db.user.findUnique({ where: { email: student.email } }),
  ).toBeNull();
  const retained = await db.user.findUniqueOrThrow({
    where: { id: student.id },
  });
  expect(retained.removedAt).toBeInstanceOf(Date);
  expect(retained).toMatchObject({
    status: "INACTIVE",
    usn: null,
    passwordHash: "",
    emailVerified: false,
    mfaSecret: null,
    pendingMfaSecret: null,
  });
  expect(
    await db.submission.findUniqueOrThrow({ where: { id: achievement.id } }),
  ).toMatchObject({ studentId: student.id, pointsAwarded: 40 });
  expect(
    await db.evidence.findUniqueOrThrow({ where: { id: evidence.id } }),
  ).toMatchObject({ ownerId: student.id });
  expect(
    await db.pointEntry.findUniqueOrThrow({ where: { id: points.id } }),
  ).toMatchObject({ userId: student.id, amount: 40 });
  expect(await db.userBadge.count({ where: { userId: student.id } })).toBe(1);
  expect(await db.honorRoll.count({ where: { userId: student.id } })).toBe(1);
  expect(
    (
      await db.authSession.findUniqueOrThrow({
        where: { id: login!.sessionId },
      })
    ).revokedAt,
  ).toBeInstanceOf(Date);
  expect(await db.accountToken.count({ where: { userId: student.id } })).toBe(
    0,
  );
  expect(
    await db.passwordHistory.count({ where: { userId: student.id } }),
  ).toBe(0);
  expect(
    await db.mfaRecoveryCode.count({ where: { userId: student.id } }),
  ).toBe(0);
  expect(
    (await db.reportSchedule.findUniqueOrThrow({ where: { id: schedule.id } }))
      .active,
  ).toBe(false);
  expect(
    (await db.reportJob.findUniqueOrThrow({ where: { id: job.id } })).status,
  ).toBe("CANCELLED");
  expect(
    (await db.mailOutbox.findUniqueOrThrow({ where: { id: mail.id } })).status,
  ).toBe("CANCELLED");
  await expect(
    consumeAccountToken({
      token,
      purpose: "RESET",
      password: "CorrectedTest2!",
    }),
  ).rejects.toMatchObject({ code: "INVALID_TOKEN" });
  expect(await authenticate({ email: student.email, password })).toBeNull();
  expect(await authenticate({ email: retained.email, password })).toBeNull();
  const logs = await db.auditLog.findMany({ where: { entityId: student.id } });
  expect(logs.map((log) => log.action)).toEqual(
    expect.arrayContaining(["USER_UPDATED", "ACCOUNT_REMOVED"]),
  );
  for (const log of logs) {
    const { signature, createdAt, ...payload } = log;
    expect(
      signAudit(
        { ...payload, createdAt: createdAt.toISOString() },
        process.env.AUDIT_SECRET!,
      ),
    ).toBe(signature);
  }
  const replacement = await createUser(admin, {
    name: "Corrected student",
    email: student.email,
    usn: student.usn,
    departmentId,
    role: "STUDENT",
    password,
  });
  expect(replacement.id).not.toBe(student.id);
  expect(await db.pointEntry.count({ where: { userId: replacement.id } })).toBe(
    0,
  );
  expect(
    await db.submission.count({ where: { studentId: replacement.id } }),
  ).toBe(0);
});

it("removes Faculty assignments and escalates open reviews while retaining completed reviews", async () => {
  const reviewer = await account({ role: "FACULTY", usn: null });
  const student = await account({ mentorId: reviewer.id });
  await db.department.update({
    where: { id: departmentId },
    data: { defaultVerifierId: reviewer.id },
  });
  await db.category.update({
    where: { id: categoryId },
    data: { verifierId: reviewer.id },
  });
  const approved = await submission(student.id, reviewer.id, "APPROVED");
  const open = await submission(student.id, reviewer.id, "SUBMITTED");
  const clarification = await submission(
    student.id,
    reviewer.id,
    "CLARIFICATION_REQUESTED",
  );
  const event = await db.verificationEvent.create({
    data: {
      submissionId: approved.id,
      actorId: reviewer.id,
      action: "APPROVED",
    },
  });
  await updateUser(admin, reviewer.id, { status: "INACTIVE" });
  await removeAccount(admin, reviewer.id, {
    email: reviewer.email,
    status: "INACTIVE",
  });
  expect(
    (await db.user.findUniqueOrThrow({ where: { id: student.id } })).mentorId,
  ).toBeNull();
  expect(
    (await db.department.findUniqueOrThrow({ where: { id: departmentId } }))
      .defaultVerifierId,
  ).toBeNull();
  expect(
    (await db.category.findUniqueOrThrow({ where: { id: categoryId } }))
      .verifierId,
  ).toBeNull();
  for (const pending of [open, clarification])
    expect(
      await db.submission.findUniqueOrThrow({ where: { id: pending.id } }),
    ).toMatchObject({ reviewerId: null, escalated: true, version: 1 });
  expect(
    (await db.submission.findUniqueOrThrow({ where: { id: approved.id } }))
      .reviewerId,
  ).toBe(reviewer.id);
  expect(
    (await db.verificationEvent.findUniqueOrThrow({ where: { id: event.id } }))
      .actorId,
  ).toBe(reviewer.id);
  const hod = await account({ role: "HOD", usn: null });
  expect(
    (await dashboardData(hod)).submissions
      .filter((s) => s.escalated)
      .map((s) => s.id),
  ).toEqual(expect.arrayContaining([open.id, clarification.id]));
});

it("requires Admin permission, exact confirmation and prior deactivation, and prevents restoration", async () => {
  const target = await account();
  for (const role of ["STUDENT", "FACULTY", "HOD"] as const)
    await expect(
      removeAccount({ ...admin, role }, target.id, {
        email: target.email,
        status: "INACTIVE",
      }),
    ).rejects.toMatchObject({ status: 403 });
  await expect(
    removeAccount(admin, admin.id, { email: admin.email, status: "INACTIVE" }),
  ).rejects.toMatchObject({ code: "SELF_EDIT" });
  await expect(
    removeAccount(admin, target.id, {
      email: target.email,
      status: "INACTIVE",
    }),
  ).rejects.toMatchObject({ code: "ACCOUNT_NOT_DEACTIVATED" });
  await updateUser(admin, target.id, { status: "INACTIVE" });
  await expect(
    removeAccount(admin, target.id, {
      email: "wrong@atria.edu",
      status: "INACTIVE",
    }),
  ).rejects.toMatchObject({ code: "ACCOUNT_CHANGED" });
  await expect(
    removeAccount(admin, target.id, { email: target.email, status: "PENDING" }),
  ).rejects.toMatchObject({ code: "NOT_PENDING_REGISTRATION" });
  await removeAccount(admin, target.id, {
    email: target.email,
    status: "INACTIVE",
  });
  for (const status of ["ACTIVE", "PENDING"] as const)
    await expect(
      updateUser(admin, target.id, { status }),
    ).rejects.toMatchObject({ status: 404 });
  await expect(
    removeAccount(admin, target.id, {
      email: target.email,
      status: "INACTIVE",
    }),
  ).rejects.toMatchObject({ status: 404 });
});

it("also removes deactivated HOD and other Admin accounts without removing audit references", async () => {
  for (const role of ["HOD", "ADMIN"] as const) {
    const target = await account({
      role,
      usn: null,
      mfaSecret: encrypt(authenticator.generateSecret()),
    });
    await updateUser(admin, target.id, { status: "INACTIVE" });
    await removeAccount(admin, target.id, {
      email: target.email,
      status: "INACTIVE",
    });
    expect(
      (await db.user.findUniqueOrThrow({ where: { id: target.id } })).removedAt,
    ).toBeInstanceOf(Date);
    expect(
      await db.auditLog.count({
        where: { entityId: target.id, action: "ACCOUNT_REMOVED" },
      }),
    ).toBe(1);
  }
});

it("does not send new notification emails to removed accounts", async () => {
  const target = await account({ status: "INACTIVE" });
  await removeAccount(admin, target.id, {
    email: target.email,
    status: "INACTIVE",
  });
  const notification = await db.notification.create({
    data: { userId: target.id, title: "Historical update", body: "Test" },
  });
  await queueNotificationEmail();
  expect(
    await db.mailOutbox.count({
      where: { dedupKey: `notification:${notification.id}` },
    }),
  ).toBe(0);
});

it("concurrent reactivation and removal cannot restore a removed account or remove an active account", async () => {
  const target = await account({ status: "INACTIVE" });
  const result = await Promise.allSettled([
    removeAccount(admin, target.id, {
      email: target.email,
      status: "INACTIVE",
    }),
    updateUser(admin, target.id, { status: "ACTIVE" }),
  ]);
  expect(result.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  const retained = await db.user.findUniqueOrThrow({
    where: { id: target.id },
  });
  if (retained.removedAt) {
    expect(retained.status).toBe("INACTIVE");
    await expect(
      updateUser(admin, target.id, { status: "ACTIVE" }),
    ).rejects.toMatchObject({ status: 404 });
  } else {
    expect(retained.status).toBe("ACTIVE");
    expect(retained.email).toBe(target.email);
    expect(
      await db.auditLog.count({
        where: { entityId: target.id, action: "ACCOUNT_REMOVED" },
      }),
    ).toBe(0);
  }
});
