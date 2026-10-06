import { db } from "@/lib/db";
import { Prisma, User } from "@/generated/prisma/client";
import { assert } from "@/lib/errors";
import { submissionSchema, reviewSchema } from "@/lib/validation";
import {
  businessDeadline,
  calculatePoints,
  canReadSubmission,
  canReview,
  MULTIPLIERS,
  OPEN_STATUSES,
  titleSimilarity,
} from "@/lib/rules";
import { audit } from "./audit";
export const submissionInclude = {
  student: true,
  reviewer: true,
  category: true,
  semester: true,
  evidence: true,
  events: {
    include: { actor: { select: { name: true, role: true } } },
    orderBy: { createdAt: "asc" as const },
  },
};
export function submissionScope(user: User): Prisma.SubmissionWhereInput {
  if (user.role === "ADMIN") return { status: { not: "DRAFT" } };
  if (user.role === "STUDENT") return { studentId: user.id };
  if (user.role === "HOD")
    return { departmentId: user.departmentId, status: { not: "DRAFT" } };
  return {
    departmentId: user.departmentId,
    status: { not: "DRAFT" },
    OR: [{ reviewerId: user.id }, { student: { mentorId: user.id } }],
  };
}
export async function getSubmission(user: User, id: string) {
  const s = await db.submission.findUnique({
    where: { id },
    include: submissionInclude,
  });
  assert(
    s &&
      canReadSubmission(user, s) &&
      (s.status !== "DRAFT" || s.studentId === user.id),
    404,
    "NOT_FOUND",
    "Submission not found.",
  );
  return s;
}
export async function evaluateBadges(
  tx: Prisma.TransactionClient,
  userId: string,
  actor: User,
) {
  const sum = await tx.pointEntry.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  const badges = await tx.badge.findMany({
    where: { active: true, users: { none: { userId } } },
  });
  const approved = await tx.submission.findMany({
    where: { studentId: userId, status: "APPROVED" },
    select: { categoryId: true, semesterId: true },
  });
  const semesters = await tx.semester.findMany({
    orderBy: { startDate: "asc" },
    select: { id: true },
  });
  const semesterIds = new Set(approved.map((s) => s.semesterId));
  let streak = 0,
    maxStreak = 0;
  for (const semester of semesters) {
    streak = semesterIds.has(semester.id) ? streak + 1 : 0;
    maxStreak = Math.max(streak, maxStreak);
  }
  const honorRoll = await tx.honorRoll.count({ where: { userId } });
  for (const badge of badges) {
    const count = approved.filter(
      (s) => !badge.categoryId || s.categoryId === badge.categoryId,
    ).length;
    const eligible =
      badge.ruleType === "MILESTONE"
        ? (sum._sum.amount ?? 0) >= badge.threshold
        : badge.ruleType === "STREAK"
          ? maxStreak >= Math.max(1, badge.threshold)
          : badge.ruleType === "SEMESTER"
            ? honorRoll > 0
            : count >= Math.max(1, badge.threshold);
    if (!eligible) continue;
    const awarded = await tx.userBadge.createMany({
      data: [{ userId, badgeId: badge.id }],
      skipDuplicates: true,
    });
    if (!awarded.count) continue;
    await tx.notification.create({
      data: {
        userId,
        title: `Badge earned: ${badge.name}`,
        body: badge.description,
        link: "/profile",
      },
    });
    await audit(tx, actor, "BADGE_AWARDED", "Badge", badge.id, { userId });
  }
}
export async function saveSubmission(user: User, raw: unknown, id?: string) {
  assert(
    user.role === "STUDENT",
    403,
    "FORBIDDEN",
    "Only students can submit achievements.",
  );
  const d = submissionSchema.parse(raw);
  return db.$transaction(
    async (tx) => {
      // Prevent simultaneous duplicate submissions from bypassing the warning.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${user.id}))`;
      const existing = id
        ? await tx.submission.findUnique({
            where: { id },
            include: { evidence: true },
          })
        : null;
      if (id)
        assert(
          existing &&
            existing.studentId === user.id &&
            ["DRAFT", "CLARIFICATION_REQUESTED", "REJECTED"].includes(
              existing.status,
            ),
          409,
          "INVALID_STATE",
          "This submission can no longer be edited.",
        );
      assert(
        !existing ||
          existing.status === "DRAFT" ||
          (!d.draft && existing.resubmissionCount < 3),
        409,
        "RESUBMISSION_LIMIT",
        "Contact your HOD after three resubmissions.",
      );
      const category = await tx.category.findUnique({
        where: { id: d.categoryId },
      });
      assert(
        category?.active &&
          (!category.departmentId ||
            category.departmentId === user.departmentId),
        422,
        "INVALID_CATEGORY",
        "Choose an active category in your department.",
      );
      assert(
        !d.subcategory || category.subcategories.includes(d.subcategory),
        422,
        "SUBCATEGORY",
        "Choose a subcategory configured for this category.",
      );
      assert(
        !category.subcategories.length || !!d.subcategory,
        422,
        "SUBCATEGORY",
        "Choose an achievement subcategory.",
      );
      const collaborators = [...new Set(d.collaboratorIds)];
      assert(
        !collaborators.includes(user.id),
        422,
        "COLLABORATORS",
        "You are already the claimant; tag other students.",
      );
      assert(
        (await tx.user.count({
          where: {
            id: { in: collaborators },
            role: "STUDENT",
            status: "ACTIVE",
            removedAt: null,
            departmentId: user.departmentId,
          },
        })) === collaborators.length,
        422,
        "COLLABORATORS",
        "Choose active students from your department.",
      );
      assert(
        !category.requiresPosition || !!d.position?.trim(),
        422,
        "POSITION_REQUIRED",
        "Enter your competition result or position.",
      );
      const semesters = await tx.semester.findMany({
        orderBy: { startDate: "desc" },
      });
      const active = semesters.find((s) => s.active);
      assert(
        active,
        422,
        "NO_SEMESTER",
        "An administrator must configure the active semester.",
      );
      const previous = semesters.filter((s) => s.endDate < active.startDate)[0];
      const date = new Date(d.achievementDate + "T00:00:00.000Z");
      const semester = [active, previous].find(
        (s) => s && date >= s.startDate && date <= s.endDate,
      );
      assert(
        semester,
        422,
        "DATE_OUT_OF_RANGE",
        "The achievement date must be within the active or preceding semester.",
      );
      assert(
        new Set(d.evidenceIds).size === d.evidenceIds.length,
        422,
        "INVALID_EVIDENCE",
        "Each evidence file can only be attached once.",
      );
      const evidence = await tx.evidence.findMany({
        where: { id: { in: d.evidenceIds }, ownerId: user.id },
      });
      assert(
        evidence.length === d.evidenceIds.length &&
          evidence.every(
            (e) =>
              (!e.submissionId || e.submissionId === id) &&
              (process.env.NODE_ENV !== "production" ||
                e.scanStatus === "CLEAN"),
          ),
        422,
        "INVALID_EVIDENCE",
        "Evidence must be your own uploaded documents.",
      );
      if (!d.draft) {
        const duplicates = await tx.submission.findMany({
          where: {
            studentId: user.id,
            categoryId: category.id,
            achievementDate: date,
            status: { notIn: ["DRAFT", "REJECTED", "EXPIRED"] },
            ...(id ? { id: { not: id } } : {}),
          },
          select: { title: true },
        });
        assert(
          d.confirmDuplicate ||
            !duplicates.some((s) => titleSimilarity(s.title, d.title) >= 0.85),
          409,
          "POTENTIAL_DUPLICATE",
          "A similar achievement already exists. Confirm the duplicate warning to continue.",
        );
      }
      const dept = await tx.department.findUniqueOrThrow({
        where: { id: user.departmentId },
      });
      const candidates = [
        user.mentorId,
        category.verifierId,
        dept.defaultVerifierId,
      ].filter(Boolean) as string[];
      let reviewerId: string | null = null;
      for (const candidate of candidates) {
        const faculty = await tx.user.findFirst({
          where: {
            id: candidate,
            departmentId: user.departmentId,
            role: "FACULTY",
            status: "ACTIVE",
          },
        });
        const conflict = await tx.conflictOfInterest.findUnique({
          where: {
            facultyId_studentId: { facultyId: candidate, studentId: user.id },
          },
        });
        if (faculty && !conflict) {
          reviewerId = faculty.id;
          break;
        }
      }
      assert(
        d.draft || reviewerId,
        422,
        "NO_REVIEWER",
        "Ask your department to assign a faculty reviewer.",
      );
      const resubmit = existing && existing.status !== "DRAFT";
      const values = {
        subcategory: d.subcategory || null,
        collaboratorIds: collaborators,
        title: d.title,
        description: d.description,
        organization: d.organization,
        categoryId: category.id,
        level: d.level,
        position: d.position || null,
        externalUrl: d.externalUrl || null,
        achievementDate: date,
        semesterId: semester.id,
        reviewerId,
        checklistSnapshot: category.checklist,
        status: (d.draft ? "DRAFT" : resubmit ? "RESUBMITTED" : "SUBMITTED") as
          "DRAFT" | "RESUBMITTED" | "SUBMITTED",
        ...(!d.draft
          ? {
              submittedAt: new Date(),
              slaDeadline: businessDeadline(new Date(), dept.slaDays),
            }
          : {}),
        ...(resubmit
          ? {
              resubmissionCount: existing.resubmissionCount + 1,
              clarificationAt: null,
              escalated: false,
              escalationReason: null,
            }
          : {}),
      };
      const saved = existing
        ? await tx.submission.update({
            where: { id: existing.id },
            data: { ...values, version: { increment: 1 } },
          })
        : await tx.submission.create({
            data: {
              ...values,
              studentId: user.id,
              departmentId: user.departmentId,
            },
          });
      if (existing)
        await tx.evidence.updateMany({
          where: { submissionId: existing.id, id: { notIn: d.evidenceIds } },
          data: { submissionId: null },
        });
      await tx.evidence.updateMany({
        where: { id: { in: d.evidenceIds } },
        data: { submissionId: saved.id },
      });
      const action = d.draft
        ? "DRAFT_SAVED"
        : resubmit
          ? "RESUBMITTED"
          : "SUBMITTED";
      await tx.verificationEvent.create({
        data: {
          submissionId: saved.id,
          actorId: user.id,
          action,
          checklist: [],
        },
      });
      await audit(tx, user, action, "Submission", saved.id, {
        title: saved.title,
      });
      if (!d.draft)
        await tx.notification.createMany({
          data: [
            {
              userId: user.id,
              title: "Achievement received",
              body: saved.title,
              link: `/submissions/${saved.id}`,
            },
            {
              userId: reviewerId!,
              title: resubmit
                ? "Resubmission received"
                : "New achievement to review",
              body: `${user.name}: ${saved.title}`,
              link: `/submissions/${saved.id}`,
            },
          ],
        });
      return { id: saved.id, status: saved.status };
    },
    { timeout: 15000 },
  );
}
export async function reviewSubmission(user: User, id: string, raw: unknown) {
  const d = reviewSchema.parse(raw);
  return db.$transaction(
    async (tx) => {
      const s = await tx.submission.findUnique({
        where: { id },
        include: { category: true, student: true, evidence: true },
      });
      assert(
        s && canReview(user, s),
        403,
        "FORBIDDEN",
        "Only the assigned reviewer, or HOD for an escalation, can review this achievement.",
      );
      assert(
        OPEN_STATUSES.includes(s.status as (typeof OPEN_STATUSES)[number]),
        409,
        "INVALID_STATE",
        "This submission has already been reviewed or is awaiting clarification.",
      );
      if (["APPROVE", "REJECT"].includes(d.action) && user.role === "FACULTY")
        assert(
          !(await tx.conflictOfInterest.findUnique({
            where: {
              facultyId_studentId: {
                facultyId: user.id,
                studentId: s.studentId,
              },
            },
          })),
          403,
          "CONFLICT_OF_INTEREST",
          "A conflict of interest requires Admin reassignment.",
        );
      if (["APPROVE", "REJECT"].includes(d.action))
        assert(
          s.checklistSnapshot.every((item) => d.checklist.includes(item)),
          422,
          "CHECKLIST_INCOMPLETE",
          "Complete every verification checklist item.",
        );
      if (d.action === "REJECT" && s.category.rejectionCodes.length)
        assert(
          s.category.rejectionCodes.includes(d.reasonCode!),
          422,
          "REASON_CODE",
          "Choose a configured rejection reason.",
        );
      if (d.action === "APPROVE")
        assert(
          s.evidence.length > 0,
          422,
          "EVIDENCE_REQUIRED",
          "This achievement needs evidence before approval.",
        );
      if (d.action === "ESCALATE")
        assert(
          user.role === "FACULTY",
          403,
          "FORBIDDEN",
          "Only faculty can escalate to HOD.",
        );
      if (["RETURN", "REASSIGN"].includes(d.action))
        assert(
          user.role === "HOD" && s.escalated,
          403,
          "FORBIDDEN",
          "Only HOD can return or reassign an escalation.",
        );
      let reviewerId = s.reviewerId;
      if (d.action === "REASSIGN") {
        const f = await tx.user.findFirst({
          where: {
            id: d.reviewerId,
            role: "FACULTY",
            departmentId: user.departmentId,
            status: "ACTIVE",
          },
        });
        assert(
          f,
          422,
          "INVALID_REVIEWER",
          "Choose active faculty in your department.",
        );
        assert(
          !(await tx.conflictOfInterest.findUnique({
            where: {
              facultyId_studentId: { facultyId: f.id, studentId: s.studentId },
            },
          })),
          422,
          "CONFLICT_OF_INTEREST",
          "Choose a reviewer without a conflict of interest.",
        );
        reviewerId = f.id;
      }
      const points =
        d.action === "APPROVE"
          ? calculatePoints(
              s.category.basePoints,
              s.level,
              Number(s.category.multiplier),
            )
          : 0;
      const status =
        d.action === "APPROVE"
          ? "APPROVED"
          : d.action === "REJECT"
            ? "REJECTED"
            : d.action === "CLARIFY"
              ? "CLARIFICATION_REQUESTED"
              : "UNDER_REVIEW";
      const now = new Date();
      const updated = await tx.submission.updateMany({
        where: { id: s.id, version: d.version },
        data: {
          status,
          reviewerId,
          version: { increment: 1 },
          ...(["APPROVE", "REJECT"].includes(d.action)
            ? { reviewedAt: now, pointsAwarded: points, escalated: false }
            : {}),
          ...(d.action === "APPROVE"
            ? {
                pointSnapshot: {
                  base: s.category.basePoints,
                  level: MULTIPLIERS[s.level],
                  weight: Number(s.category.multiplier),
                  final: points,
                },
              }
            : {}),
          ...(d.action === "CLARIFY" ? { clarificationAt: now } : {}),
          ...(d.action === "ESCALATE"
            ? { escalated: true, escalationReason: d.comment, escalatedAt: now }
            : {}),
          ...(["RETURN", "REASSIGN"].includes(d.action)
            ? {
                escalated: false,
                escalationReason: null,
                slaDeadline: businessDeadline(now, 5),
              }
            : {}),
        },
      });
      assert(
        updated.count === 1,
        409,
        "STALE_REVIEW",
        "Another reviewer changed this submission. Refresh and try again.",
      );
      if (d.action === "APPROVE") {
        // Unique submissionId in the ledger plus optimistic locking makes awards exactly once.
        await tx.pointEntry.create({
          data: {
            userId: s.studentId,
            actorId: user.id,
            submissionId: s.id,
            semesterId: s.semesterId,
            amount: points,
            note: `${s.category.name}: ${s.title}`,
          },
        });
        await audit(tx, user, "POINTS_AWARDED", "Submission", s.id, {
          amount: points,
        });
        await evaluateBadges(tx, s.studentId, user);
      }
      await tx.verificationEvent.create({
        data: {
          submissionId: s.id,
          actorId: user.id,
          action: d.action,
          comment: d.comment,
          reasonCode: d.reasonCode,
          checklist: d.checklist,
        },
      });
      await audit(tx, user, d.action, "Submission", s.id, {
        previousStatus: s.status,
        status,
        points,
        comment: d.comment,
      });
      if (d.action === "ESCALATE") {
        const hods = await tx.user.findMany({
          where: {
            role: "HOD",
            departmentId: s.departmentId,
            status: "ACTIVE",
          },
        });
        assert(
          hods.length > 0,
          422,
          "NO_HOD",
          "Your department needs an active HOD before escalation.",
        );
        await tx.notification.createMany({
          data: hods.map((h) => ({
            userId: h.id,
            title: "Escalation needs review",
            body: d.comment,
            link: `/submissions/${s.id}`,
          })),
        });
      } else if (d.action !== "START") {
        await tx.notification.create({
          data: {
            userId: s.studentId,
            title: `Achievement ${status.toLowerCase().replaceAll("_", " ")}`,
            body: `${s.title}${points ? ` · +${points} points` : ""}${d.comment ? `: ${d.comment}` : ""}`,
            link: `/submissions/${s.id}`,
          },
        });
        if (d.action === "REASSIGN" && reviewerId)
          await tx.notification.create({
            data: {
              userId: reviewerId,
              title: "Achievement reassigned to you",
              body: s.title,
              link: `/submissions/${s.id}`,
            },
          });
      }
      return { id: s.id, status, pointsAwarded: points };
    },
    { timeout: 15000 },
  );
}
