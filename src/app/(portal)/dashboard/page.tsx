import Link from "next/link";
import {
  ArrowUpRight,
  Award,
  Clock3,
  FileCheck2,
  GraduationCap,
  Plus,
  Sparkles,
  Users,
  Trophy,
} from "lucide-react";
import { pageUser } from "@/server/session";
import { db } from "@/lib/db";
import { dashboardData, leaderboard } from "@/server/analytics";
import {
  Card,
  Heading,
  Stat,
  SubmissionTable,
  BadgeWall,
  date,
} from "@/components/ui";
export default async function Dashboard() {
  const u = await pageUser();
  const d = await dashboardData(u);
  const semester = await db.semester.findFirst({ where: { active: true } });
  const notifications = await db.notification.findMany({
    where: { userId: u.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  if (u.role === "STUDENT") {
    const badges = await db.userBadge.findMany({
      where: { userId: u.id, revokedAt: null },
      include: { badge: true },
    });
    const ranks = await leaderboard(u, { semesterId: semester?.id });
    const me = ranks.find((r) => r.id === u.id);
    const semesterPoints = await db.pointEntry.aggregate({
      where: { userId: u.id, semesterId: semester?.id },
      _sum: { amount: true },
    });
    return (
      <>
        <Heading
          eyebrow={`${u.department.code} · ${semester?.label ?? "Academic year"}`}
          title={`Welcome back, ${u.name.split(" ")[0]}.`}
          description="Big things start with small milestones. Here’s how you’re doing."
          action={
            <Link className="btn" href="/submissions/new">
              <Plus size={15} /> Add achievement
            </Link>
          }
        />
        <section className="hero">
          <div>
            <div className="eyebrow">Your merit journey</div>
            <h2>Keep growing. We’re keeping count.</h2>
            <p className="small muted">
              Every verified achievement adds to your story.
            </p>
            <Link
              className="small"
              href="/leaderboard"
              style={{
                display: "inline-flex",
                gap: 6,
                alignItems: "center",
                marginTop: 18,
              }}
            >
              Explore the leaderboard <ArrowUpRight size={14} />
            </Link>
          </div>
          <div style={{ minWidth: 230 }}>
            <div className="hero-score">
              {d.points}
              <span>verified points</span>
            </div>
            <div className="progress">
              <span
                style={{ width: `${Math.min((d.points / 500) * 100, 100)}%` }}
              />
            </div>
            <p className="tiny muted">
              {d.points >= 500
                ? "Silver Merit milestone reached"
                : "Your next milestone: Silver Merit · 500 pts"}
            </p>
          </div>
        </section>
        <div className="stats">
          <Stat
            title="This semester"
            value={semesterPoints._sum.amount ?? 0}
            detail="Points from verified achievements"
            icon={<Sparkles size={18} />}
          />
          <Stat
            title="Verified achievements"
            value={d.approved.length}
            detail="Recognized and added to your portfolio"
            icon={<FileCheck2 size={18} />}
          />
          <Stat
            title="Awaiting review"
            value={d.pending.length}
            detail="Your faculty mentor is on it"
            icon={<Clock3 size={18} />}
          />
          <Stat
            title="Department rank"
            value={me ? `#${me.rank}` : "—"}
            detail="Current semester · CSE leaderboard"
            icon={<Trophy size={18} />}
          />
        </div>
        <div className="columns">
          <Card
            title="Recent achievements"
            link={{ href: "/submissions", label: "View all" }}
          >
            <SubmissionTable rows={d.submissions.slice(0, 5)} />
          </Card>
          <div className="stack">
            <Card title="A little recognition goes a long way">
              <BadgeWall badges={badges.map((b) => b.badge)} />
            </Card>
            <Card title="Latest updates">
              {notifications.map((n) => (
                <div className="activity" key={n.id}>
                  <Link href={n.link || "/notifications"}>
                    <strong className="small">{n.title}</strong>
                  </Link>
                  <p className="tiny muted">{date(n.createdAt)}</p>
                </div>
              ))}
              {!notifications.length && (
                <p className="muted small">Your activity will appear here.</p>
              )}
            </Card>
          </div>
        </div>
      </>
    );
  }
  const isFaculty = u.role === "FACULTY";
  const queue = d.pending.filter((s) =>
    isFaculty ? s.reviewerId === u.id && !s.escalated : s.escalated,
  );
  const overdue = d.pending.filter(
    (s) => s.slaDeadline && s.slaDeadline < new Date(),
  );
  return (
    <>
      <Heading
        eyebrow={`${u.department.code} · ${semester?.label ?? "Department"}`}
        title={
          isFaculty
            ? "A little guidance. A lasting impact."
            : u.role === "HOD"
              ? "Your department, in perspective."
              : "Keep the platform moving."
        }
        description={
          isFaculty
            ? "Review achievements and help your students move forward."
            : "A clear view of achievements, recognition and the people behind them."
        }
        action={
          <Link className="btn" href={isFaculty ? "/submissions" : "/reports"}>
            {isFaculty ? "Open verification queue" : "Generate a report"}
            <ArrowUpRight size={14} />
          </Link>
        }
      />
      <div className="stats">
        <Stat
          title={isFaculty ? "Your review queue" : "Verified achievements"}
          value={isFaculty ? queue.length : d.approved.length}
          detail={
            isFaculty
              ? "Assigned to you, oldest first"
              : "Across the department"
          }
          icon={<FileCheck2 size={18} />}
        />
        <Stat
          title="Points awarded"
          value={d.points}
          detail="Cumulative verified merit"
          icon={<Award size={18} />}
        />
        <Stat
          title={isFaculty ? "Assigned mentees" : "Active students"}
          value={d.students.length}
          detail={`${d.atRisk.length} with no verified achievements`}
          icon={<GraduationCap size={18} />}
        />
        <Stat
          title="Overdue reviews"
          value={overdue.length}
          detail="Beyond the department review deadline"
          icon={<Clock3 size={18} />}
        />
      </div>
      <div className="columns">
        <div className="stack">
          <Card
            title={
              isFaculty ? "Your next reviews" : "Escalations needing attention"
            }
            link={{ href: "/submissions", label: "Browse achievements" }}
          >
            <SubmissionTable
              rows={queue
                .sort(
                  (a, b) =>
                    (a.submittedAt?.getTime() ?? 0) -
                    (b.submittedAt?.getTime() ?? 0),
                )
                .slice(0, 5)}
              showStudent
            />
          </Card>
          {!isFaculty && (
            <Card title="Where achievements are happening">
              {d.categories.map((c) => (
                <div className="bar-row" key={c.name}>
                  <span className="small">{c.name}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${(c.count / Math.max(...d.categories.map((x) => x.count), 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <strong className="small">{c.count}</strong>
                </div>
              ))}
              {!d.categories.length && (
                <p className="empty">Approved achievements will appear here.</p>
              )}
            </Card>
          )}
          <Card
            title={
              isFaculty ? "Your mentees" : "Students who could use a nudge"
            }
          >
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Batch</th>
                    <th>Verified</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {(isFaculty ? d.students : d.atRisk).slice(0, 10).map((s) => (
                    <tr key={s.id}>
                      <td>
                        <strong>{s.name}</strong>
                        <p className="tiny muted">
                          {s.usn} · {s.mentor?.name ?? "No mentor"}
                        </p>
                      </td>
                      <td>{s.batchYear}</td>
                      <td>{s.submissions.length}</td>
                      <td>{s.ledger.reduce((a, l) => a + l.amount, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
        <div className="stack">
          <Card title={isFaculty ? "Mentee participation" : "Batch comparison"}>
            {isFaculty ? (
              <>
                <Users size={30} color="#719578" />
                <h2 style={{ marginTop: 15 }}>
                  {d.students.length - d.atRisk.length} of {d.students.length}{" "}
                  are recognized
                </h2>
                <div className="progress">
                  <span
                    style={{
                      width: `${((d.students.length - d.atRisk.length) / Math.max(d.students.length, 1)) * 100}%`,
                    }}
                  />
                </div>
                <p className="small muted">
                  Encourage students to submit their work, even the small
                  milestones.
                </p>
              </>
            ) : (
              d.batches.map((b) => (
                <div key={b.name} style={{ marginBottom: 22 }}>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span className="small">{b.name}</span>
                    <strong className="small">{b.average} pts</strong>
                  </div>
                  <div className="progress">
                    <span
                      style={{
                        width: `${(b.average / Math.max(...d.batches.map((x) => x.average), 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="tiny muted">
                    Average verified points per student
                  </p>
                </div>
              ))
            )}
          </Card>
          <Card title="Recent activity">
            {notifications.map((n) => (
              <div className="activity" key={n.id}>
                <Link href={n.link || "/notifications"}>
                  <strong className="small">{n.title}</strong>
                </Link>
                <p className="tiny muted">{date(n.createdAt)}</p>
              </div>
            ))}
          </Card>
          {u.role === "ADMIN" && (
            <Card title="Administration">
              <p className="small muted">
                Manage accounts, recognition rules and platform records.
              </p>
              <Link
                href="/admin"
                className="btn secondary"
                style={{ marginTop: 18 }}
              >
                Open administration ↗
              </Link>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
