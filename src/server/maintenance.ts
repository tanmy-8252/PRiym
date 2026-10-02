import { db } from "@/lib/db";
import { businessDeadline, OPEN_STATUSES } from "@/lib/rules";
import { audit } from "./audit";
async function maintenanceState() {
  return db.$transaction(
    async (tx) => {
      const acquired = await tx.$queryRaw<
        { locked: boolean }[]
      >`SELECT pg_try_advisory_xact_lock(913823) AS locked`;
      if (!acquired[0]?.locked) return { skipped: true };
      const now = new Date();
      const expired = await tx.submission.findMany({
        where: {
          OR: [
            {
              status: "CLARIFICATION_REQUESTED",
              clarificationAt: { lt: new Date(now.getTime() - 14 * 86400_000) },
            },
            {
              status: "DRAFT",
              updatedAt: { lt: new Date(now.getTime() - 30 * 86400_000) },
            },
          ],
        },
      });
      for (const s of expired) {
        await tx.submission.update({
          where: { id: s.id },
          data: { status: "EXPIRED", version: { increment: 1 } },
        });
        await tx.verificationEvent.create({
          data: {
            submissionId: s.id,
            actorId: s.studentId,
            action: "EXPIRED",
            checklist: [],
          },
        });
        await tx.notification.create({
          data: {
            userId: s.studentId,
            title: "Achievement expired",
            body: `${s.title}: no update was received within the response period.`,
            link: `/submissions/${s.id}`,
          },
        });
        await audit(tx, null, "SUBMISSION_EXPIRED", "Submission", s.id);
      }
      const pending = await tx.submission.findMany({
        where: {
          status: { in: [...OPEN_STATUSES] },
          escalated: false,
          slaDeadline: { lt: now },
        },
      });
      let escalated = 0;
      for (const s of pending) {
        if (!s.slaDeadline || businessDeadline(s.slaDeadline, 2) > now)
          continue;
        const hods = await tx.user.findMany({
          where: {
            role: "HOD",
            departmentId: s.departmentId,
            status: "ACTIVE",
          },
          select: { id: true },
        });
        if (!hods.length) continue;
        const changed = await tx.submission.updateMany({
          where: { id: s.id, version: s.version },
          data: {
            escalated: true,
            escalatedAt: now,
            escalationReason:
              "Automatically escalated after two business days beyond the review deadline.",
            version: { increment: 1 },
          },
        });
        if (!changed.count) continue;
        await tx.notification.createMany({
          data: hods.map((h) => ({
            userId: h.id,
            title: "Overdue achievement escalated",
            body: s.title,
            link: `/submissions/${s.id}`,
            dedupKey: `escalation:${s.id}:${s.version}:${h.id}`,
          })),
        });
        await audit(tx, null, "AUTO_ESCALATED", "Submission", s.id);
        escalated++;
      }
      return { expired: expired.length, escalated };
    },
    { timeout: 30000 },
  );
}

import { queueNotificationEmail, deliverMail } from "./mail";
import { runReportJobs } from "./report-jobs";
async function sendReminders() {
  return db.$transaction(
    async (tx) => {
      const now = new Date(),
        pending = await tx.submission.findMany({
          where: {
            status: { in: [...OPEN_STATUSES] },
            submittedAt: { not: null },
          },
          include: { department: true },
        });
      let reminders = 0;
      const notify = async (
        userId: string,
        title: string,
        s: (typeof pending)[number],
        key: string,
      ) => {
        const r = await tx.notification.createMany({
          data: [
            {
              userId,
              title,
              body: s.title,
              link: `/submissions/${s.id}`,
              dedupKey: key,
            },
          ],
          skipDuplicates: true,
        });
        reminders += r.count;
      };
      for (const s of pending) {
        if (!s.submittedAt) continue;
        if (s.reviewerId && !s.escalated)
          for (const day of [3, 4, s.department.slaDays]) {
            if (businessDeadline(s.submittedAt, day) <= now)
              await notify(
                s.reviewerId,
                day === s.department.slaDays
                  ? "Review SLA breached"
                  : `Review reminder: day ${day}`,
                s,
                `sla:${s.id}:${s.resubmissionCount}:${day}:${s.reviewerId}`,
              );
          }
        if (s.slaDeadline && s.slaDeadline < now) {
          const hods = await tx.user.findMany({
            where: {
              role: "HOD",
              departmentId: s.departmentId,
              status: "ACTIVE",
            },
          });
          for (const h of hods)
            await notify(
              h.id,
              "Department review SLA breached",
              s,
              `hod-sla:${s.id}:${s.resubmissionCount}:${h.id}`,
            );
        }
        if (
          s.escalatedAt &&
          s.escalated &&
          businessDeadline(s.escalatedAt, 3) < now
        ) {
          for (const a of await tx.user.findMany({
            where: { role: "ADMIN", status: "ACTIVE" },
          }))
            await notify(
              a.id,
              "HOD escalation SLA breached",
              s,
              `admin-sla:${s.id}:${s.escalatedAt.toISOString()}:${a.id}`,
            );
        }
      }
      const clarification = await tx.submission.findMany({
        where: {
          status: "CLARIFICATION_REQUESTED",
          clarificationAt: { lt: new Date(now.getTime() - 7 * 86400_000) },
        },
        include: { department: true },
      });
      for (const s of clarification)
        await notify(
          s.studentId,
          "Clarification response reminder",
          s,
          `clarification:${s.id}:${s.resubmissionCount}`,
        );
      await tx.notification.deleteMany({
        where: { createdAt: { lt: new Date(now.getTime() - 90 * 86400_000) } },
      });
      return reminders;
    },
    { timeout: 30000 },
  );
}
export async function maintenance() {
  const state = await maintenanceState(),
    reminders = await sendReminders(),
    reports = await runReportJobs();
  await queueNotificationEmail();
  const email = await deliverMail();
  return { ...state, reminders, ...reports, email };
}
