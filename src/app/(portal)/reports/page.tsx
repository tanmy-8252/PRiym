import { pageUser } from "@/server/session";
import { Heading, Card } from "@/components/ui";
import { Download } from "lucide-react";
import { db } from "@/lib/db";
import {
  ReportScheduleForm,
  DeleteSchedule,
} from "@/components/report-schedule";
export default async function Reports() {
  const u = await pageUser(["STUDENT", "HOD", "ADMIN"]);
  const [jobs, schedules] = await Promise.all([
    db.reportJob.findMany({
      where: { userId: u.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.reportSchedule.findMany({ where: { userId: u.id } }),
  ]);
  return (
    <>
      <Heading
        title="A clear record. Ready to share."
        description={
          u.role === "STUDENT"
            ? "Export your verified achievements for applications and your own records."
            : "Export department achievement data for review, planning and reporting."
        }
      />
      <div className="columns">
        <Card
          title={
            u.role === "STUDENT"
              ? "My achievement report"
              : "Department achievement report"
          }
        >
          <form action="/api/v1/reports" method="get">
            <div className="form-grid">
              {u.role !== "STUDENT" && (
                <div className="field full">
                  <label htmlFor="type">Report type</label>
                  <select id="type" name="type">
                    <option value="achievements">Achievement records</option>
                    <option value="summary">Department summary</option>
                    <option value="faculty">Faculty verification & SLA</option>
                    <option value="batch">Batch performance</option>
                    <option value="naac">NAAC indicator mapping</option>
                    <option value="nba">NBA program-outcome mapping</option>
                    <option value="honor">Archived honor roll</option>
                    {u.role === "ADMIN" && (
                      <option value="audit">Audit log</option>
                    )}
                  </select>
                </div>
              )}
              <div className="field">
                <label htmlFor="from">Achievement date — from</label>
                <input id="from" type="date" name="from" />
              </div>
              <div className="field">
                <label htmlFor="to">Achievement date — to</label>
                <input id="to" type="date" name="to" />
              </div>
              <div className="field">
                <label htmlFor="status">Include</label>
                <select id="status" name="status">
                  <option value="APPROVED">Verified achievements only</option>
                  <option value="all">All submitted achievements</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="format">File format</label>
                <select id="format" name="format">
                  <option value="csv">CSV</option>
                  <option value="xlsx">Excel (.xlsx)</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn">
                <Download size={14} /> Download report
              </button>
            </div>
          </form>
        </Card>
        <Card title="A useful, auditable record">
          <p className="small muted">
            Each export includes the student, category, achievement level, date,
            verification status, points, reviewer and semester.
          </p>
          <div className="notice small">
            PDF reports show the generating user and timestamp. Each export is
            recorded in the audit log.
          </div>
          <p className="tiny muted">
            Larger reports run in the background. NAAC/NBA mappings come from
            institution-configured category rules; unmapped records are labeled
            for review.
          </p>
        </Card>
      </div>
      <div className="stack" style={{ marginTop: 24 }}>
        <Card title="Background reports">
          {jobs.map((j) => (
            <div className="file-row" key={j.id}>
              <div>
                <strong>{j.status}</strong>
                <p className="tiny muted">
                  {j.createdAt.toLocaleString("en-IN")} {j.error || ""}
                </p>
              </div>
              {j.status === "READY" &&
                j.expiresAt &&
                j.expiresAt > new Date() && (
                  <a
                    className="btn secondary"
                    href={`/api/v1/reports/jobs/${j.id}`}
                  >
                    Download
                  </a>
                )}
            </div>
          ))}
          {!jobs.length && (
            <p className="small muted">
              Reports over 500 records appear here. Refresh to check progress.
            </p>
          )}
        </Card>
        {u.role !== "STUDENT" && (
          <Card title="Scheduled reports">
            <ReportScheduleForm />
            {schedules.map((s) => (
              <div className="file-row" key={s.id}>
                <span>
                  {s.frequency} · {s.query}
                </span>
                <DeleteSchedule id={s.id} />
              </div>
            ))}
          </Card>
        )}
      </div>
    </>
  );
}
