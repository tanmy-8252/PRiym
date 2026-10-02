import { db } from "@/lib/db";
import { z } from "zod";
import { assert } from "@/lib/errors";
import type { User, Prisma } from "@/generated/prisma/client";
import { submissionScope } from "./submissions";
import { reportBytes } from "./reports";
import { audit } from "./audit";
import { queueMail } from "./mail";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
export const reportFilters = z
  .object({
    type: z
      .enum([
        "achievements",
        "summary",
        "faculty",
        "batch",
        "naac",
        "nba",
        "honor",
        "audit",
      ])
      .default("achievements"),
    format: z.enum(["csv", "xlsx", "pdf"]).default("csv"),
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
    status: z.enum(["APPROVED", "all"]).default("APPROVED"),
    category: z.string().uuid().optional(),
    batch: z.coerce.number().int().min(2000).max(2100).optional(),
    semester: z.string().uuid().optional(),
  })
  .refine(
    (d) => !d.from || !d.to || d.from <= d.to,
    "End date must follow start.",
  );
export type ReportFilters = z.infer<typeof reportFilters>;
export function checkReportAccess(u: User, f: ReportFilters) {
  assert(
    ["STUDENT", "HOD", "ADMIN"].includes(u.role),
    403,
    "FORBIDDEN",
    "Reports are available to Students, HOD and Admin.",
  );
  assert(
    u.role !== "STUDENT" || f.type === "achievements",
    403,
    "FORBIDDEN",
    "Students can export their own achievement report.",
  );
  assert(
    f.type !== "audit" || u.role === "ADMIN",
    403,
    "FORBIDDEN",
    "Audit reports require an administrator.",
  );
}
export function reportWhere(
  u: User,
  f: ReportFilters,
): Prisma.SubmissionWhereInput {
  checkReportAccess(u, f);
  return {
    AND: [
      submissionScope(u),
      { status: f.status === "all" ? { not: "DRAFT" } : "APPROVED" },
      ...(f.category ? [{ categoryId: f.category }] : []),
      ...(f.semester ? [{ semesterId: f.semester }] : []),
      ...(f.batch ? [{ student: { batchYear: f.batch } }] : []),
      ...(f.from || f.to
        ? [
            {
              achievementDate: {
                ...(f.from ? { gte: new Date(f.from) } : {}),
                ...(f.to ? { lte: new Date(f.to) } : {}),
              },
            },
          ]
        : []),
    ],
  };
}
export async function buildReport(u: User, f: ReportFilters) {
  checkReportAccess(u, f);
  let data: string[][];
  if (f.type === "audit") {
    const rows = await db.auditLog.findMany({
      where: {
        createdAt: {
          ...(f.from ? { gte: new Date(f.from) } : {}),
          ...(f.to
            ? { lt: new Date(new Date(f.to).getTime() + 86400_000) }
            : {}),
        },
      },
      orderBy: { createdAt: "asc" },
    });
    data = [
      [
        "Timestamp",
        "Actor",
        "Role",
        "Action",
        "Entity",
        "Entity ID",
        "Metadata",
        "Signature",
      ],
      ...rows.map((r) => [
        r.createdAt.toISOString(),
        r.actorId || "SYSTEM",
        r.actorRole,
        r.action,
        r.entityType,
        r.entityId || "",
        JSON.stringify(r.metadata),
        r.signature,
      ]),
    ];
  } else if (f.type === "honor") {
    const where: Prisma.HonorRollWhereInput = {
      ...(u.role === "ADMIN" ? {} : { departmentId: u.departmentId }),
      ...(f.semester ? { semesterId: f.semester } : {}),
      ...(f.from || f.to
        ? {
            semester: {
              startDate: {
                ...(f.from ? { gte: new Date(f.from) } : {}),
                ...(f.to ? { lte: new Date(f.to) } : {}),
              },
            },
          }
        : {}),
    };
    const rows = await db.honorRoll.findMany({
      where,
      include: { user: true, semester: true },
      orderBy: [{ semester: { startDate: "desc" } }, { rank: "asc" }],
    });
    data = [
      ["Semester", "Student", "USN", "Rank", "Points"],
      ...rows.map((r) => [
        r.semester.label,
        r.user.name,
        r.user.usn || "",
        String(r.rank),
        String(r.points),
      ]),
    ];
  } else {
    const rows = await db.submission.findMany({
      where: reportWhere(u, f),
      include: {
        student: {
          select: { id: true, name: true, usn: true, batchYear: true },
        },
        reviewer: { select: { id: true, name: true } },
        category: true,
        semester: true,
      },
      orderBy: { achievementDate: "desc" },
    });
    const base = [
      [
        "Student",
        "USN",
        "Batch",
        "Title",
        "Category",
        "Level",
        "Date",
        "Status",
        "Points",
        "Reviewer",
        "Semester",
      ],
      ...rows.map((s) => [
        s.student.name,
        s.student.usn || "",
        String(s.student.batchYear || ""),
        s.title,
        s.category.name,
        s.level,
        s.achievementDate.toISOString().slice(0, 10),
        s.status,
        String(s.pointsAwarded),
        s.reviewer?.name || "",
        s.semester.label,
      ]),
    ];
    if (f.type === "achievements") data = base;
    else if (f.type === "naac" || f.type === "nba")
      data = [
        [
          ...base[0],
          f.type === "naac"
            ? "Institution-configured NAAC indicator"
            : "Institution-configured program outcomes",
        ],
        ...rows.map((s, i) => [
          ...base[i + 1],
          f.type === "naac"
            ? s.category.naacIndicator ||
              "UNMAPPED — institutional review required"
            : s.category.programOutcomes.join(", ") ||
              "UNMAPPED — institutional review required",
        ]),
      ];
    else if (f.type === "faculty") {
      const groups = new Map<string, typeof rows>();
      for (const r of rows) {
        const key = r.reviewer?.name || "Unassigned";
        groups.set(key, [...(groups.get(key) || []), r]);
      }
      data = [
        [
          "Faculty",
          "Assigned",
          "Reviewed",
          "Pending",
          "SLA compliant reviews",
          "Average review hours",
        ],
        ...Array.from(groups, ([name, r]) => {
          const reviewed = r.filter((s) => s.reviewedAt && s.submittedAt);
          return [
            name,
            String(r.length),
            String(reviewed.length),
            String(
              r.filter(
                (s) => !["APPROVED", "REJECTED", "EXPIRED"].includes(s.status),
              ).length,
            ),
            String(
              reviewed.filter(
                (s) => s.slaDeadline && s.reviewedAt! <= s.slaDeadline,
              ).length,
            ),
            reviewed.length
              ? (
                  reviewed.reduce(
                    (sum, s) =>
                      sum +
                      (s.reviewedAt!.getTime() - s.submittedAt!.getTime()) /
                        3600_000,
                    0,
                  ) / reviewed.length
                ).toFixed(2)
              : "0",
          ];
        }),
      ];
    } else if (f.type === "batch") {
      const groups = new Map<string, typeof rows>();
      for (const r of rows) {
        const key = String(r.student.batchYear || "Unknown");
        groups.set(key, [...(groups.get(key) || []), r]);
      }
      data = [
        [
          "Batch",
          "Submissions",
          "Approved",
          "Points",
          "Participating students",
          "Average points per participant",
        ],
        ...Array.from(groups, ([batch, r]) => {
          const count = new Set(r.map((s) => s.student.id)).size,
            points = r.reduce((sum, s) => sum + s.pointsAwarded, 0);
          return [
            batch,
            String(r.length),
            String(r.filter((s) => s.status === "APPROVED").length),
            String(points),
            String(count),
            (points / Math.max(1, count)).toFixed(2),
          ];
        }),
      ];
    } else {
      const approved = rows.filter((s) => s.status === "APPROVED"),
        groups = new Map<string, { count: number; points: number }>(),
        students = new Map<string, { name: string; points: number }>();
      for (const s of approved) {
        for (const k of [
          `Category: ${s.category.name}`,
          `Batch: ${s.student.batchYear || "Unknown"}`,
        ]) {
          const g = groups.get(k) || { count: 0, points: 0 };
          g.count++;
          g.points += s.pointsAwarded;
          groups.set(k, g);
        }
        const student = students.get(s.student.id) || {
          name: s.student.name,
          points: 0,
        };
        student.points += s.pointsAwarded;
        students.set(s.student.id, student);
      }
      data = [
        ["Section", "Metric", "Count", "Points"],
        [
          "Overview",
          "Total submissions",
          String(rows.length),
          String(approved.reduce((sum, s) => sum + s.pointsAwarded, 0)),
        ],
        ["Overview", "Approved", String(approved.length), ""],
        ...Array.from(groups, ([k, v]) => [
          "Breakdown",
          k,
          String(v.count),
          String(v.points),
        ]),
        ...Array.from(students.values())
          .sort((a, b) => b.points - a.points)
          .slice(0, 10)
          .map((s, i) => [
            "Top students",
            `${i + 1}. ${s.name}`,
            "",
            String(s.points),
          ]),
      ];
    }
  }
  const result = await reportBytes(
    data,
    f.format,
    `${f.type} | Generated by ${u.name} (${u.role}) | ${new Date().toISOString()} | ${f.from || "all dates"} to ${f.to || "present"}`,
  );
  await audit(db, u, "REPORT_EXPORTED", "Report", null, {
    ...f,
    rowCount: Math.max(0, data.length - 1),
  });
  return result;
}
export async function queueReport(u: User, query: string) {
  const f = reportFilters.parse(Object.fromEntries(new URLSearchParams(query)));
  checkReportAccess(u, f);
  assert(
    (await db.reportJob.count({
      where: { userId: u.id, status: { in: ["PENDING", "PROCESSING"] } },
    })) < 5,
    429,
    "QUEUE_LIMIT",
    "Wait for your current reports to complete.",
  );
  return db.reportJob.create({
    data: {
      userId: u.id,
      scopeDepartmentId: u.departmentId,
      ownerRole: u.role,
      query: new URLSearchParams(
        Object.entries(f).map(([k, v]) => [k, String(v)]),
      ).toString(),
    },
  });
}
const reportDir = () =>
  path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    process.env.REPORT_DIR || ".data/reports",
  );
export async function runReportJobs() {
  let done = 0;
  const due = await db.reportSchedule.findMany({
    where: { active: true, nextRunAt: { lte: new Date() } },
    include: { user: true },
    take: 20,
  });
  for (const schedule of due) {
    if (schedule.user.status !== "ACTIVE") continue;
    if (schedule.user.role === "ADMIN") {
      // Institution-wide scheduled reports may only be shared with other Admins.
      const recipients = await db.user.findMany({
        where: {
          email: { in: schedule.recipients },
          role: "ADMIN",
          status: "ACTIVE",
        },
        select: { email: true },
      });
      schedule.recipients = recipients.map((r) => r.email);
    }
    const interval =
      schedule.frequency === "DAILY"
        ? 1
        : schedule.frequency === "WEEKLY"
          ? 7
          : 30;
    await db.$transaction(async (tx) => {
      const changed = await tx.reportSchedule.updateMany({
        where: { id: schedule.id, nextRunAt: schedule.nextRunAt },
        data: { nextRunAt: new Date(Date.now() + interval * 86400_000) },
      });
      if (changed.count)
        await tx.reportJob.create({
          data: {
            userId: schedule.userId,
            query: schedule.query,
            scopeDepartmentId: schedule.user.departmentId,
            ownerRole: schedule.user.role,
          },
        });
    });
  }
  const pending = await db.reportJob.findMany({
    where: { status: "PENDING" },
    include: { user: true },
    take: 5,
    orderBy: { createdAt: "asc" },
  });
  for (const job of pending) {
    const claimed = await db.reportJob.updateMany({
      where: { id: job.id, status: "PENDING" },
      data: { status: "PROCESSING" },
    });
    if (!claimed.count) continue;
    try {
      assert(
        job.user.status === "ACTIVE" &&
          job.user.role === job.ownerRole &&
          job.user.departmentId === job.scopeDepartmentId,
        403,
        "INACTIVE",
        "Report owner is inactive.",
      );
      const f = reportFilters.parse(
        Object.fromEntries(new URLSearchParams(job.query)),
      );
      const report = await buildReport(job.user, f);
      await mkdir(reportDir(), { recursive: true, mode: 0o700 });
      const key = `${job.id}.${report.extension}`;
      await writeFile(
        path.join(/* turbopackIgnore: true */ reportDir(), key),
        report.bytes,
        {
          mode: 0o600,
        },
      );
      await db.$transaction(async (tx) => {
        await tx.reportJob.update({
          where: { id: job.id },
          data: {
            status: "READY",
            storageKey: key,
            expiresAt: new Date(Date.now() + 24 * 3600_000),
          },
        });
        await tx.notification.create({
          data: {
            userId: job.userId,
            title: "Report ready",
            body: `Your ${f.type} report is ready for 24 hours.`,
            link: "/reports",
          },
        });
        await queueMail(
          tx,
          job.user.email,
          "Your PRiym report is ready",
          `${process.env.AUTH_URL}/api/v1/reports/jobs/${job.id}\nSign in to download within 24 hours.`,
          `report:${job.id}`,
        );
        const schedules = await tx.reportSchedule.findMany({
          where: { userId: job.userId, query: job.query, active: true },
        });
        for (const s of schedules)
          for (const recipient of s.recipients.filter(
            (r) => r !== job.user.email,
          ))
            await queueMail(
              tx,
              recipient,
              "PRiym scheduled report ready",
              `${process.env.AUTH_URL}/api/v1/reports/jobs/${job.id}\nSign in with an authorized institutional account. Expires in 24 hours.`,
              `scheduled:${job.id}:${recipient}`,
            );
      });
      done++;
    } catch (e) {
      await db.reportJob.update({
        where: { id: job.id },
        data: { status: "FAILED", error: (e as Error).message.slice(0, 300) },
      });
    }
  }
  return { reports: done };
}
export async function downloadReport(u: User, id: string) {
  const job = await db.reportJob.findUnique({
    where: { id },
    include: { user: true },
  });
  assert(
    job &&
      job.user.status === "ACTIVE" &&
      job.user.role === job.ownerRole &&
      job.user.departmentId === job.scopeDepartmentId &&
      (job.userId === u.id ||
        u.role === "ADMIN" ||
        (u.role === "HOD" &&
          job.user.departmentId === u.departmentId &&
          job.user.role === "HOD")),
    404,
    "NOT_FOUND",
    "Report not found.",
  );
  assert(
    job.status === "READY" &&
      job.expiresAt &&
      job.expiresAt > new Date() &&
      job.storageKey,
    410,
    "EXPIRED",
    "Report is not ready or has expired.",
  );
  const f = reportFilters.parse(
    Object.fromEntries(new URLSearchParams(job.query)),
  );
  checkReportAccess(u, f);
  const bytes = await readFile(
    path.join(reportDir(), path.basename(job.storageKey)),
  );
  return { bytes, format: f.format };
}
