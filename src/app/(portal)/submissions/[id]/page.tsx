import { pageUser } from "@/server/session";
import { db } from "@/lib/db";
import { getSubmission } from "@/server/submissions";
import { Heading, Card, Status, date, label } from "@/components/ui";
import { canReview, OPEN_STATUSES } from "@/lib/rules";
import { ReviewForm } from "@/components/review-form";
import { notFound } from "next/navigation";
import { AppError } from "@/lib/errors";
import Link from "next/link";
import { FileText } from "lucide-react";
import { InstitutionForm } from "@/components/institution-controls";
export default async function SubmissionDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const u = await pageUser();
  const s = await getSubmission(u, (await params).id).catch((e) => {
    if (e instanceof AppError && e.status === 404) notFound();
    throw e;
  });
  const review =
    canReview(u, s) &&
    OPEN_STATUSES.includes(s.status as (typeof OPEN_STATUSES)[number]);
  const faculty =
    (review && u.role === "HOD") || u.role === "ADMIN"
      ? await db.user.findMany({
          where: {
            departmentId: s.departmentId,
            role: "FACULTY",
            status: "ACTIVE",
          },
          select: { id: true, name: true },
        })
      : [];
  return (
    <>
      <Heading
        eyebrow={`${s.category.name} · ${s.id.slice(0, 8)}`}
        title={s.title}
        description={`Submitted by ${s.student.name} · ${s.student.usn ?? ""}`}
        action={<Status status={s.status} />}
      />
      <div className="columns">
        <div className="stack">
          <Card title="The achievement">
            <p>{s.description}</p>
            <dl className="detail-grid">
              <div>
                <dt>Organization</dt>
                <dd>{s.organization}</dd>
              </div>
              <div>
                <dt>Achievement date</dt>
                <dd>{date(s.achievementDate)}</dd>
              </div>
              <div>
                <dt>Level</dt>
                <dd>{label(s.level)}</dd>
              </div>
              <div>
                <dt>Position / result</dt>
                <dd>{s.position || "—"}</dd>
              </div>
              <div>
                <dt>Reviewer</dt>
                <dd>{s.reviewer?.name || "Awaiting assignment"}</dd>
              </div>
              <div>
                <dt>Points awarded</dt>
                <dd>
                  {s.status === "APPROVED"
                    ? `+${s.pointsAwarded} verified points`
                    : "Awaiting approval"}
                </dd>
              </div>
              <div>
                <dt>Semester</dt>
                <dd>{s.semester.label}</dd>
              </div>
              <div>
                <dt>Review deadline</dt>
                <dd>{date(s.slaDeadline)}</dd>
              </div>
            </dl>
            {s.externalUrl && (
              <a
                className="btn secondary"
                style={{ marginTop: 25 }}
                target="_blank"
                rel="noreferrer"
                href={s.externalUrl}
              >
                View external link ↗
              </a>
            )}
            {s.escalated && (
              <div className="notice warning">
                Escalated to HOD: {s.escalationReason}
              </div>
            )}
            {s.studentId === u.id &&
              ["DRAFT", "CLARIFICATION_REQUESTED", "REJECTED"].includes(
                s.status,
              ) &&
              s.resubmissionCount < 3 && (
                <Link
                  className="btn"
                  style={{ marginTop: 20 }}
                  href={`/submissions/${s.id}/edit`}
                >
                  {s.status === "DRAFT"
                    ? "Continue draft"
                    : "Update and resubmit"}
                </Link>
              )}
          </Card>
          {s.subcategory && (
            <p className="small muted">Subcategory: {s.subcategory}</p>
          )}
          {u.role === "ADMIN" && (
            <Card title="Reassign pending achievement">
              <InstitutionForm
                action="REASSIGN"
                id={s.id}
                button="Reassign"
                fields={[
                  { name: "facultyId", label: "Reviewer", options: faculty },
                  { name: "reason", label: "Reason (20+ characters)" },
                ]}
              />
            </Card>
          )}
          <Card title="Supporting evidence">
            {s.evidence.map((e) => (
              <div className="file-row" key={e.id}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <FileText size={20} />
                  <div>
                    <strong className="small">{e.fileName}</strong>
                    <p className="tiny muted">
                      {(e.sizeBytes / 1024).toFixed(1)} KB · {e.mimeType} ·{" "}
                      {e.scanStatus === "CLEAN"
                        ? "Scanned"
                        : "Development upload — not malware scanned"}
                    </p>
                  </div>
                </div>
                {u.role !== "ADMIN" ? (
                  <a
                    className="btn secondary"
                    href={`/api/v1/evidence/${e.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View ↗
                  </a>
                ) : (
                  <span className="tiny muted">
                    Document exception review required
                  </span>
                )}
              </div>
            ))}
            {!s.evidence.length && (
              <p className="muted small">
                No documents attached to this draft.
              </p>
            )}
          </Card>
          {review && (
            <Card
              title={
                u.role === "HOD"
                  ? "HOD escalation review"
                  : "Verify this achievement"
              }
            >
              <ReviewForm
                rejectionCodes={s.category.rejectionCodes}
                id={s.id}
                version={s.version}
                checklist={s.checklistSnapshot}
                isHod={u.role === "HOD"}
                faculty={faculty}
              />
            </Card>
          )}
        </div>
        <Card title="Activity & feedback">
          {s.events.map((e) => (
            <div className="activity" key={e.id}>
              <strong className="small">{label(e.action)}</strong>
              <p className="tiny muted">
                {e.actor.name} · {date(e.createdAt)}
              </p>
              {e.comment && (
                <p className="small" style={{ marginTop: 8 }}>
                  {e.comment}
                </p>
              )}
              {e.reasonCode && (
                <p className="tiny muted">Reason: {label(e.reasonCode)}</p>
              )}
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}
