import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import {
  saveSubmission,
  reviewSubmission,
  getSubmission,
} from "@/server/submissions";
import { authenticate } from "@/server/authentication";
import { createUser, updateUser } from "@/server/admin";
import { hash } from "bcryptjs";
import { randomUUID } from "node:crypto";
import { encrypt } from "@/lib/crypto";
import { authenticator } from "otplib";
import type { User } from "@/generated/prisma/client";
let student: User,
  other: User,
  faculty: User,
  unassigned: User,
  hod: User,
  admin: User,
  category: { id: string; checklist: string[] };
const unique = randomUUID().slice(0, 8);
async function evidence() {
  return db.evidence.create({
    data: {
      ownerId: student.id,
      fileName: "proof.pdf",
      mimeType: "application/pdf",
      sizeBytes: 10,
      sha256: "a".repeat(64),
      storageKey: `${student.id}/${randomUUID()}`,
      scanStatus: "CLEAN",
    },
  });
}
async function submit(title = `Technical award ${randomUUID().slice(0, 8)}`) {
  const e = await evidence();
  return saveSubmission(student, {
    title,
    description:
      "A verifiable technical award with detailed supporting evidence.",
    organization: "Atria Institute",
    achievementDate: new Date().toISOString().slice(0, 10),
    categoryId: category.id,
    level: "NATIONAL",
    evidenceIds: [e.id],
  });
}
beforeAll(async () => {
  const dept = await db.department.create({
      data: { code: `T${unique}`, name: "Test CSE" },
    }),
    dept2 = await db.department.create({
      data: { code: `X${unique}`, name: "Other dept" },
    });
  const passwordHash = await hash("PriymDemo1!", 4);
  const make = (role: User["role"], name: string, departmentId = dept.id) =>
    db.user.create({
      data: {
        name,
        email: `${name.replaceAll(" ", "").toLowerCase()}+${unique}@atria.edu`,
        role,
        departmentId,
        passwordHash,
        ...(role === "STUDENT" ? { usn: `TEST${randomUUID()}` } : {}),
        status: "ACTIVE",
        emailVerified: true,
      },
    });
  faculty = await make("FACULTY", "Faculty");
  unassigned = await make("FACULTY", "Unassigned");
  student = await make("STUDENT", "Student");
  other = await make("STUDENT", "Other student", dept2.id);
  hod = await make("HOD", "HOD");
  admin = await make("ADMIN", "Admin");
  await db.user.update({
    where: { id: student.id },
    data: { mentorId: faculty.id },
  });
  student = { ...student, mentorId: faculty.id };
  await db.department.update({
    where: { id: dept.id },
    data: { defaultVerifierId: faculty.id },
  });
  if (!(await db.semester.findFirst({ where: { active: true } }))) {
    const year = new Date().getUTCFullYear();
    await db.semester.create({
      data: {
        label: "Test year",
        startDate: new Date(`${year}-01-01`),
        endDate: new Date(`${year}-12-31`),
        active: true,
      },
    });
  }
  category = await db.category.create({
    data: {
      name: `Test category ${unique}`,
      description: "Test",
      basePoints: 100,
      departmentId: dept.id,
      checklist: ["Evidence is valid", "Date matches"],
    },
  });
  await db.badge.create({
    data: {
      name: `Test milestone ${unique}`,
      description: "100 point milestone",
      threshold: 100,
    },
  });
});
afterAll(() => db.$disconnect());
describe("complete achievement lifecycle", () => {
  it("routes to mentor and atomically awards points, badge, notifications and audit", async () => {
    const s = await submit();
    expect((await getSubmission(student, s.id)).reviewerId).toBe(faculty.id);
    const result = await reviewSubmission(faculty, s.id, {
      action: "APPROVE",
      version: 0,
      checklist: category.checklist,
    });
    expect(result.pointsAwarded).toBe(150);
    expect(await db.pointEntry.count({ where: { submissionId: s.id } })).toBe(
      1,
    );
    expect(
      await db.userBadge.count({ where: { userId: student.id } }),
    ).toBeGreaterThan(0);
    expect(
      await db.notification.count({ where: { userId: student.id } }),
    ).toBeGreaterThan(0);
    expect(
      await db.auditLog.count({ where: { entityId: s.id, action: "APPROVE" } }),
    ).toBe(1);
    await expect(
      reviewSubmission(faculty, s.id, {
        action: "APPROVE",
        version: 0,
        checklist: category.checklist,
      }),
    ).rejects.toThrow();
  });
  it("handles competing approvals without awarding points twice", async () => {
    const s = await submit();
    const r = await Promise.allSettled([
      reviewSubmission(faculty, s.id, {
        action: "APPROVE",
        version: 0,
        checklist: category.checklist,
      }),
      reviewSubmission(faculty, s.id, {
        action: "APPROVE",
        version: 0,
        checklist: category.checklist,
      }),
    ]);
    expect(r.filter((x) => x.status === "fulfilled")).toHaveLength(1);
    expect(await db.pointEntry.count({ where: { submissionId: s.id } })).toBe(
      1,
    );
  });
  it("rejects without awarding any points and preserves feedback", async () => {
    const s = await submit();
    await reviewSubmission(faculty, s.id, {
      action: "REJECT",
      version: 0,
      checklist: category.checklist,
      comment: "The certificate identity does not match the student.",
      reasonCode: "INVALID_EVIDENCE",
    });
    expect((await getSubmission(student, s.id)).status).toBe("REJECTED");
    expect(await db.pointEntry.count({ where: { submissionId: s.id } })).toBe(
      0,
    );
  });
  it("supports clarification and resubmission", async () => {
    const s = await submit();
    await reviewSubmission(faculty, s.id, {
      action: "CLARIFY",
      version: 0,
      comment: "Please provide a readable copy of the certificate.",
    });
    const old = await getSubmission(student, s.id);
    await saveSubmission(
      student,
      {
        title: old.title,
        description: old.description,
        organization: old.organization,
        achievementDate: old.achievementDate.toISOString().slice(0, 10),
        categoryId: category.id,
        level: old.level,
        evidenceIds: old.evidence.map((e) => e.id),
      },
      s.id,
    );
    const updated = await getSubmission(student, s.id);
    expect(updated.status).toBe("RESUBMITTED");
    expect(updated.resubmissionCount).toBe(1);
    await reviewSubmission(faculty, s.id, {
      action: "APPROVE",
      version: updated.version,
      checklist: category.checklist,
    });
  });
  it("escalates to HOD and removes faculty decision authority", async () => {
    const s = await submit();
    await reviewSubmission(faculty, s.id, {
      action: "ESCALATE",
      version: 0,
      comment:
        "This international certificate needs department approval because I cannot independently verify its issuing organization.",
    });
    await expect(
      reviewSubmission(faculty, s.id, {
        action: "APPROVE",
        version: 1,
        checklist: category.checklist,
      }),
    ).rejects.toThrow();
    await reviewSubmission(hod, s.id, {
      action: "APPROVE",
      version: 1,
      checklist: category.checklist,
    });
  });
  it("blocks other departments, unrelated students and unassigned reviewers", async () => {
    const s = await submit();
    await expect(getSubmission(other, s.id)).rejects.toThrow();
    await expect(
      reviewSubmission(unassigned, s.id, {
        action: "APPROVE",
        version: 0,
        checklist: category.checklist,
      }),
    ).rejects.toThrow();
  });
  it("blocks stolen evidence and requires duplicate confirmation", async () => {
    const s = await submit("Unique award duplicate check");
    const old = await getSubmission(student, s.id);
    await expect(
      saveSubmission(other, {
        title: "Stolen evidence award",
        description: old.description,
        organization: old.organization,
        categoryId: category.id,
        achievementDate: old.achievementDate.toISOString().slice(0, 10),
        level: "NATIONAL",
        evidenceIds: old.evidence.map((e) => e.id),
      }),
    ).rejects.toThrow();
    await expect(submit("Unique award duplicate check")).rejects.toThrow(
      "similar achievement",
    );
  });
  it("prevents database updates to awarded ledger and audit records", async () => {
    const p = await db.pointEntry.findFirstOrThrow({
      where: { userId: student.id },
    });
    await expect(
      db.pointEntry.update({ where: { id: p.id }, data: { amount: 9999 } }),
    ).rejects.toThrow();
    const a = await db.auditLog.findFirstOrThrow({
      where: { actorId: faculty.id },
    });
    await expect(db.auditLog.delete({ where: { id: a.id } })).rejects.toThrow();
  });
});
describe("authentication and administration", () => {
  it("locks account after five failed attempts", async () => {
    for (let i = 0; i < 5; i++)
      expect(
        await authenticate({ email: other.email, password: "wrong-password" }),
      ).toBeNull();
    const u = await db.user.findUniqueOrThrow({ where: { id: other.id } });
    expect(u.failedAttempts).toBe(5);
    expect(u.lockedUntil!.getTime()).toBeGreaterThan(Date.now());
    expect(
      await authenticate({ email: other.email, password: "PriymDemo1!" }),
    ).toBeNull();
  });
  it("requires HOD MFA and prevents TOTP replay", async () => {
    const secret = authenticator.generateSecret();
    await db.user.update({
      where: { id: hod.id },
      data: { mfaSecret: encrypt(secret) },
    });
    expect(
      await authenticate({ email: hod.email, password: "PriymDemo1!" }),
    ).toBeNull();
    const otp = authenticator.generate(secret);
    expect(
      await authenticate({ email: hod.email, password: "PriymDemo1!", otp }),
    ).not.toBeNull();
    expect(
      await authenticate({ email: hod.email, password: "PriymDemo1!", otp }),
    ).toBeNull();
  });
  it("requires admin authority and revokes sessions on deactivation", async () => {
    await expect(
      createUser(student, { name: "Test Person" }),
    ).rejects.toThrow();
    const login = await authenticate({
      email: student.email,
      password: "PriymDemo1!",
    });
    expect(login).not.toBeNull();
    await updateUser(admin, student.id, { status: "INACTIVE" });
    expect(
      (
        await db.authSession.findUniqueOrThrow({
          where: { id: login!.sessionId },
        })
      ).revokedAt,
    ).not.toBeNull();
    expect(
      await authenticate({ email: student.email, password: "PriymDemo1!" }),
    ).toBeNull();
  });
});
