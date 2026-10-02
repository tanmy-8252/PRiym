import { db } from "@/lib/db";
import type { User } from "@/generated/prisma/client";
import { submissionScope } from "./submissions";
export async function leaderboard(
  user: User,
  filters: { semesterId?: string; batch?: number; categoryId?: string } = {},
) {
  const students = await db.user.findMany({
    where: {
      role: "STUDENT",
      status: "ACTIVE",
      ...(user.role === "ADMIN" ? {} : { departmentId: user.departmentId }),
      ...(filters.batch ? { batchYear: filters.batch } : {}),
    },
    select: {
      id: true,
      name: true,
      usn: true,
      batchYear: true,
      leaderboardVisible: true,
      ledger: {
        where: {
          ...(filters.semesterId ? { semesterId: filters.semesterId } : {}),
          ...(filters.categoryId
            ? { submission: { categoryId: filters.categoryId } }
            : {}),
        },
        select: { amount: true },
      },
      badges: { where: { revokedAt: null }, select: { id: true } },
    },
  });
  return students
    .map((s) => ({
      id: s.id,
      name:
        s.leaderboardVisible ||
        ["HOD", "ADMIN"].includes(user.role) ||
        s.id === user.id
          ? s.name
          : "Anonymous",
      usn: s.usn ? `${s.usn.slice(0, 5)}••${s.usn.slice(-2)}` : "—",
      batchYear: s.batchYear,
      points: s.ledger.reduce((a, l) => a + l.amount, 0),
      badges: s.badges.length,
    }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
    .map((s, i, rows) => ({
      ...s,
      rank: rows.findIndex((r) => r.points === s.points) + 1,
      index: i,
    }));
}
export async function dashboardData(user: User) {
  const scope = submissionScope(user);
  const submissions = await db.submission.findMany({
    where: scope,
    include: {
      category: true,
      student: { select: { id: true, name: true, usn: true, batchYear: true } },
      reviewer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const studentScope = {
    role: "STUDENT" as const,
    status: "ACTIVE" as const,
    ...(user.role === "ADMIN" ? {} : { departmentId: user.departmentId }),
    ...(user.role === "FACULTY" ? { mentorId: user.id } : {}),
    ...(user.role === "STUDENT" ? { id: user.id } : {}),
  };
  const students = await db.user.findMany({
    where: studentScope,
    select: {
      id: true,
      name: true,
      usn: true,
      batchYear: true,
      mentor: { select: { name: true } },
      submissions: { where: { status: "APPROVED" }, select: { id: true } },
      ledger: { select: { amount: true } },
    },
  });
  const approved = submissions.filter((s) => s.status === "APPROVED");
  const pending = submissions.filter((s) =>
    ["SUBMITTED", "UNDER_REVIEW", "RESUBMITTED"].includes(s.status),
  );
  const categories = Array.from(
    new Set(approved.map((s) => s.category.name)),
  ).map((name) => ({
    name,
    count: approved.filter((s) => s.category.name === name).length,
    points: approved
      .filter((s) => s.category.name === name)
      .reduce((a, s) => a + s.pointsAwarded, 0),
  }));
  const batches = Array.from(new Set(students.map((s) => s.batchYear)))
    .sort()
    .map((batch) => {
      const cohort = students.filter((s) => s.batchYear === batch);
      return {
        name: `Batch ${batch}`,
        average: Math.round(
          cohort.reduce(
            (a, s) => a + s.ledger.reduce((t, l) => t + l.amount, 0),
            0,
          ) / cohort.length,
        ),
      };
    });
  return {
    submissions,
    approved,
    pending,
    students,
    categories,
    batches,
    atRisk: students.filter((s) => s.submissions.length === 0),
    points: students.reduce(
      (a, s) => a + s.ledger.reduce((t, l) => t + l.amount, 0),
      0,
    ),
  };
}
