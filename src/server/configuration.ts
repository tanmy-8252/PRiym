import { db } from "@/lib/db";
import { assert } from "@/lib/errors";
import type { User } from "@/generated/prisma/client";
import { z } from "zod";
import { audit } from "./audit";
import { issueToken } from "./account";
import { createUser } from "./admin";
import { businessDeadline, OPEN_STATUSES } from "@/lib/rules";
import { evaluateBadges } from "./submissions";
import { queueMail } from "./mail";
const configSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("DEPARTMENT"),
    id: z.string().uuid().optional(),
    name: z.string().trim().min(3).max(100),
    code: z.string().trim().min(2).max(12),
    defaultVerifierId: z.string().uuid().nullable().optional(),
  }),
  z
    .object({
      action: z.literal("SEMESTER"),
      id: z.string().uuid().optional(),
      label: z.string().min(3).max(100),
      academicYear: z.string().min(4).max(30),
      startDate: z.iso.date(),
      endDate: z.iso.date(),
      active: z.boolean().default(false),
    })
    .refine((d) => d.startDate < d.endDate, "Semester end must follow start."),
  z.object({ action: z.literal("CLOSE_SEMESTER"), id: z.string().uuid() }),
  z.object({
    action: z.literal("CONFLICT"),
    facultyId: z.string().uuid(),
    studentId: z.string().uuid(),
    reason: z.string().min(20).max(1000),
  }),
  z.object({
    action: z.literal("REMOVE_CONFLICT"),
    id: z.string().uuid(),
    reason: z.string().min(20),
  }),
  z.object({
    action: z.literal("REASSIGN"),
    id: z.string().uuid(),
    facultyId: z.string().uuid(),
    reason: z.string().min(20).max(1000),
  }),
  z.object({ action: z.literal("FORCE_RESET"), id: z.string().uuid() }),
]);
export async function configure(actor: User, raw: unknown) {
  assert(
    actor.role === "ADMIN",
    403,
    "FORBIDDEN",
    "Only administrators configure the institution.",
  );
  const d = configSchema.parse(raw);
  return db.$transaction(
    async (tx) => {
      if (d.action === "FORCE_RESET") {
        const u = await tx.user.findUnique({ where: { id: d.id } });
        assert(u, 404, "NOT_FOUND", "User not found.");
        await issueToken(tx, u, "RESET");
        await tx.authSession.updateMany({
          where: { userId: u.id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        await audit(tx, actor, "PASSWORD_RESET_FORCED", "User", u.id);
        return { ok: true };
      }
      if (d.action === "DEPARTMENT") {
        if (d.defaultVerifierId)
          assert(
            await tx.user.findFirst({
              where: {
                id: d.defaultVerifierId,
                departmentId: d.id,
                role: "FACULTY",
                status: "ACTIVE",
              },
            }),
            422,
            "VERIFIER",
            "Choose active faculty in this department.",
          );
        const data = {
          name: d.name,
          code: d.code.toUpperCase(),
          defaultVerifierId: d.defaultVerifierId,
        };
        const dept = d.id
          ? await tx.department.update({ where: { id: d.id }, data })
          : await tx.department.create({ data });
        await audit(tx, actor, "DEPARTMENT_SAVED", "Department", dept.id);
        return { id: dept.id };
      }
      if (d.action === "SEMESTER") {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(913825)`;
        const startDate = new Date(d.startDate),
          endDate = new Date(d.endDate);
        const overlap = await tx.semester.findFirst({
          where: {
            ...(d.id ? { id: { not: d.id } } : {}),
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        });
        assert(
          !overlap,
          422,
          "OVERLAP",
          "Semester date ranges cannot overlap.",
        );
        if (d.id) {
          const old = await tx.semester.findUnique({ where: { id: d.id } });
          assert(
            old && !old.closedAt,
            409,
            "CLOSED",
            "Closed semesters are archived and cannot be edited.",
          );
        }
        if (d.active)
          await tx.semester.updateMany({
            where: { active: true },
            data: { active: false },
          });
        const data = {
          label: d.label,
          academicYear: d.academicYear,
          startDate,
          endDate,
          active: d.active,
        };
        const s = d.id
          ? await tx.semester.update({ where: { id: d.id }, data })
          : await tx.semester.create({ data });
        await audit(tx, actor, "SEMESTER_SAVED", "Semester", s.id);
        return { id: s.id };
      }
      if (d.action === "CLOSE_SEMESTER") {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(913825)`;
        const s = await tx.semester.findUnique({ where: { id: d.id } });
        assert(
          s && !s.closedAt,
          409,
          "CLOSED",
          "This semester is already closed or missing.",
        );
        const depts = await tx.department.findMany();
        for (const dept of depts) {
          const rows = await tx.pointEntry.groupBy({
            by: ["userId"],
            where: { semesterId: s.id, user: { departmentId: dept.id } },
            _sum: { amount: true },
            orderBy: { _sum: { amount: "desc" } },
            take: 10,
          });
          for (const [i, row] of rows.entries()) {
            await tx.honorRoll.create({
              data: {
                userId: row.userId,
                semesterId: s.id,
                departmentId: dept.id,
                rank: i + 1,
                points: row._sum.amount || 0,
              },
            });
            await tx.notification.create({
              data: {
                userId: row.userId,
                title: "Honor roll achieved",
                body: `${s.label}: rank ${i + 1} in ${dept.name}.`,
                link: "/leaderboard",
              },
            });
          }
        }
        for (const h of await tx.honorRoll.findMany({
          where: { semesterId: s.id },
        }))
          await evaluateBadges(tx, h.userId, actor);
        await tx.semester.update({
          where: { id: s.id },
          data: { active: false, closedAt: new Date() },
        });
        await audit(tx, actor, "SEMESTER_CLOSED", "Semester", s.id);
        return { ok: true };
      }
      if (d.action === "REMOVE_CONFLICT") {
        await tx.conflictOfInterest.delete({ where: { id: d.id } });
        await audit(tx, actor, "CONFLICT_REMOVED", "ConflictOfInterest", d.id, {
          reason: d.reason,
        });
        return { ok: true };
      }
      const faculty = await tx.user.findFirst({
        where: { id: d.facultyId, role: "FACULTY", status: "ACTIVE" },
      });
      assert(faculty, 422, "FACULTY", "Choose active faculty.");
      if (d.action === "CONFLICT") {
        const student = await tx.user.findFirst({
          where: {
            id: d.studentId,
            role: "STUDENT",
            departmentId: faculty.departmentId,
          },
        });
        assert(
          student,
          422,
          "STUDENT",
          "Choose a student in the same department.",
        );
        const c = await tx.conflictOfInterest.upsert({
          where: {
            facultyId_studentId: {
              facultyId: faculty.id,
              studentId: student.id,
            },
          },
          create: {
            facultyId: faculty.id,
            studentId: student.id,
            reason: d.reason,
          },
          update: { reason: d.reason },
        });
        await audit(
          tx,
          actor,
          "CONFLICT_REGISTERED",
          "ConflictOfInterest",
          c.id,
          { reason: d.reason },
        );
        return { id: c.id };
      }
      const s = await tx.submission.findUnique({ where: { id: d.id } });
      assert(
        s && OPEN_STATUSES.includes(s.status as (typeof OPEN_STATUSES)[number]),
        409,
        "STATE",
        "Only pending submissions can be reassigned.",
      );
      assert(
        s.departmentId === faculty.departmentId,
        422,
        "DEPARTMENT",
        "Reviewer must belong to the submission’s department.",
      );
      assert(
        !(await tx.conflictOfInterest.findUnique({
          where: {
            facultyId_studentId: {
              facultyId: faculty.id,
              studentId: s.studentId,
            },
          },
        })),
        422,
        "CONFLICT",
        "Choose a reviewer without a conflict of interest.",
      );
      const dept = await tx.department.findUniqueOrThrow({
        where: { id: s.departmentId },
      });
      await tx.submission.update({
        where: { id: s.id },
        data: {
          reviewerId: faculty.id,
          escalated: false,
          status: "UNDER_REVIEW",
          slaDeadline: businessDeadline(new Date(), dept.slaDays),
          version: { increment: 1 },
        },
      });
      await tx.verificationEvent.create({
        data: {
          submissionId: s.id,
          actorId: actor.id,
          action: "REASSIGN",
          comment: d.reason,
          checklist: [],
        },
      });
      await tx.notification.create({
        data: {
          userId: faculty.id,
          title: "Achievement reassigned to you",
          body: s.title,
          link: `/submissions/${s.id}`,
        },
      });
      await audit(tx, actor, "ADMIN_REASSIGNED", "Submission", s.id, {
        reason: d.reason,
        reviewerId: faculty.id,
      });
      return { ok: true };
    },
    { timeout: 30000 },
  );
}
export async function importUsers(actor: User, raw: unknown) {
  assert(
    actor.role === "ADMIN",
    403,
    "FORBIDDEN",
    "Only administrators import accounts.",
  );
  const { rows } = z
    .object({
      rows: z.array(z.record(z.string(), z.unknown())).min(1).max(200),
    })
    .parse(raw);
  const results = [];
  for (const [i, row] of rows.entries()) {
    try {
      const u = await createUser(actor, {
        ...row,
        batchYear: row.batchYear ? Number(row.batchYear) : undefined,
      });
      results.push({ row: i + 1, id: u.id, ok: true });
    } catch (e) {
      results.push({ row: i + 1, ok: false, error: (e as Error).message });
    }
  }
  await audit(db, actor, "BULK_IMPORT", "User", null, {
    total: rows.length,
    created: results.filter((r) => r.ok).length,
  });
  return { results };
}
export async function approveRegisteredAccount(actor: User, target: User) {
  assert(
    target.emailVerified,
    422,
    "EMAIL_UNVERIFIED",
    "The user must verify their email before approval.",
  );
  await db.$transaction(async (tx) =>
    queueMail(
      tx,
      target.email,
      "Your PRiym account is approved",
      `Hello ${target.name},\nYour account is active. Sign in at ${process.env.AUTH_URL}/login`,
    ),
  );
}
