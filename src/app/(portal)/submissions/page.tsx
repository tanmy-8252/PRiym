import Link from "next/link";
import { pageUser } from "@/server/session";
import { db } from "@/lib/db";
import { submissionScope } from "@/server/submissions";
import { Heading, Card, SubmissionTable } from "@/components/ui";
import { SubmissionStatus } from "@/generated/prisma/client";
import { label } from "@/components/ui";
import { SaveFilter, BatchClarify } from "@/components/search-controls";
export default async function Submissions({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const u = await pageUser();
  const q = await searchParams;
  const page = Math.max(1, Number(q.page) || 1);
  const status =
    q.status &&
    Object.values(SubmissionStatus).includes(q.status as SubmissionStatus)
      ? (q.status as SubmissionStatus)
      : undefined;
  const where = {
    AND: [
      submissionScope(u),
      ...(status ? [{ status }] : []),
      ...(q.category ? [{ categoryId: q.category }] : []),
      ...(q.student ? [{ studentId: q.student }] : []),
      ...(q.semester ? [{ semesterId: q.semester }] : []),
      ...(q.batch && Number.isInteger(Number(q.batch))
        ? [{ student: { batchYear: Number(q.batch) } }]
        : []),
      ...(q.from && /^\d{4}-\d{2}-\d{2}$/.test(q.from)
        ? [{ achievementDate: { gte: new Date(q.from) } }]
        : []),
      ...(q.to && /^\d{4}-\d{2}-\d{2}$/.test(q.to)
        ? [{ achievementDate: { lte: new Date(q.to) } }]
        : []),
      ...(q.q
        ? [
            {
              OR: [
                { title: { contains: q.q, mode: "insensitive" as const } },
                {
                  student: {
                    name: { contains: q.q, mode: "insensitive" as const },
                  },
                },
                {
                  student: {
                    usn: { contains: q.q, mode: "insensitive" as const },
                  },
                },
              ],
            },
          ]
        : []),
      ...(u.role === "FACULTY" && q.view !== "history"
        ? [
            {
              reviewerId: u.id,
              escalated: false,
              status: {
                in: [
                  SubmissionStatus.SUBMITTED,
                  SubmissionStatus.UNDER_REVIEW,
                  SubmissionStatus.RESUBMITTED,
                ],
              },
            },
          ]
        : []),
    ],
  };
  const [rows, count, cats] = await Promise.all([
    db.submission.findMany({
      where,
      include: {
        category: true,
        student: { select: { name: true, usn: true } },
        reviewer: { select: { name: true } },
      },
      orderBy:
        u.role === "FACULTY" ? { submittedAt: "asc" } : { createdAt: "desc" },
      skip: (page - 1) * 20,
      take: 20,
    }),
    db.submission.count({ where }),
    db.category.findMany({
      where: { OR: [{ departmentId: u.departmentId }, { departmentId: null }] },
      select: { id: true, name: true },
    }),
  ]);
  const saved = ["HOD", "ADMIN"].includes(u.role)
    ? await db.savedFilter.findMany({ where: { userId: u.id } })
    : [];
  const nextQuery = new URLSearchParams(
    Object.entries(q).filter((e): e is [string, string] => !!e[1]),
  );
  return (
    <>
      <Heading
        title={
          u.role === "STUDENT"
            ? "Your achievements."
            : u.role === "FACULTY"
              ? "Verification queue."
              : "Department achievements."
        }
        description={
          u.role === "STUDENT"
            ? "A record of your effort, from first submission to recognition."
            : "Evidence, decisions and progress — all in one place."
        }
        action={
          u.role === "STUDENT" ? (
            <Link className="btn" href="/submissions/new">
              + Add achievement
            </Link>
          ) : u.role === "FACULTY" ? (
            <Link
              className="btn secondary"
              href={
                q.view === "history"
                  ? "/submissions"
                  : "/submissions?view=history"
              }
            >
              {q.view === "history"
                ? "Active queue"
                : "Review history & mentees"}
            </Link>
          ) : undefined
        }
      />
      <Card>
        <form className="filters">
          <input
            className="filter-input"
            name="q"
            aria-label="Search achievements"
            placeholder="Search achievement, student or USN…"
            defaultValue={q.q}
          />
          <select
            className="filter-input"
            name="status"
            aria-label="Filter by status"
            defaultValue={q.status ?? ""}
          >
            <option value="">All statuses</option>
            {Object.values(SubmissionStatus).map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </select>
          <select
            className="filter-input"
            name="category"
            aria-label="Filter by category"
            defaultValue={q.category ?? ""}
          >
            <option value="">All categories</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            className="filter-input"
            type="date"
            name="from"
            aria-label="From achievement date"
            defaultValue={q.from}
          />
          <input
            className="filter-input"
            type="date"
            name="to"
            aria-label="To achievement date"
            defaultValue={q.to}
          />
          <input
            className="filter-input"
            type="number"
            name="batch"
            aria-label="Batch year"
            placeholder="Batch year"
            defaultValue={q.batch}
          />
          {q.student && (
            <input type="hidden" name="student" value={q.student} />
          )}
          {q.view && <input type="hidden" name="view" value={q.view} />}
          <button className="btn secondary">Apply filters</button>
          <Link className="btn ghost" href="/submissions">
            Reset
          </Link>
        </form>
        {["HOD", "ADMIN"].includes(u.role) && (
          <>
            <SaveFilter query={nextQuery.toString()} />
            <div className="filters">
              {saved.map((f) => (
                <Link
                  key={f.id}
                  className="btn ghost"
                  href={`/submissions?${f.query}`}
                >
                  {f.label}
                </Link>
              ))}
            </div>
          </>
        )}
        <SubmissionTable rows={rows} showStudent={u.role !== "STUDENT"} />
        {u.role === "FACULTY" && q.view !== "history" && (
          <BatchClarify
            rows={rows.map((s) => ({
              id: s.id,
              title: s.title,
              version: s.version,
            }))}
          />
        )}
        <div className="form-actions">
          <span className="small muted" style={{ marginRight: "auto" }}>
            {count} achievements · Page {page} of{" "}
            {Math.max(1, Math.ceil(count / 20))}
          </span>
          {page > 1 && (
            <Link
              className="btn secondary"
              href={`/submissions?${new URLSearchParams({ ...Object.fromEntries(nextQuery), page: String(page - 1) })}`}
            >
              Previous
            </Link>
          )}
          {page * 20 < count && (
            <Link
              className="btn secondary"
              href={`/submissions?${new URLSearchParams({ ...Object.fromEntries(nextQuery), page: String(page + 1) })}`}
            >
              Next
            </Link>
          )}
        </div>
      </Card>
    </>
  );
}
