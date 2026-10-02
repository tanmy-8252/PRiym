import { Award, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
export const label = (s: string) =>
  s
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
export const date = (d: Date | string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      })
    : "—";
export function Logo() {
  return (
    <div className="logo">
      <span className="logo-mark">P</span>
      <span>
        PRiym<span style={{ color: "#89a984" }}>.</span>
      </span>
    </div>
  );
}
export function Status({ status }: { status: string }) {
  return <span className={`status ${status}`}>{label(status)}</span>;
}
export function Heading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow ?? "Your progress, recognized"}</div>
        <h1>{title}</h1>
        <p className="muted small">{description}</p>
      </div>
      {action}
    </div>
  );
}
export function Card({
  title,
  link,
  children,
  className = "",
}: {
  title?: string;
  link?: { href: string; label: string };
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {title && (
        <div className="card-heading">
          <h2>{title}</h2>
          {link && (
            <Link className="small muted" href={link.href}>
              {link.label}{" "}
              <ArrowUpRight size={12} style={{ display: "inline" }} />
            </Link>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
export function Stat({
  title,
  value,
  detail,
  icon,
}: {
  title: string;
  value: number | string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <div className="card stat">
      <div className="stat-top">
        <span>{title}</span>
        {icon}
      </div>
      <div className="stat-value">{value}</div>
      <div className="tiny muted">{detail}</div>
    </div>
  );
}
export function BadgeWall({
  badges,
}: {
  badges: { name: string; description: string }[];
}) {
  return badges.length ? (
    badges.map((b) => (
      <div className="badge-tile" key={b.name}>
        <div className="badge-icon">
          <Award size={22} />
        </div>
        <div>
          <strong className="small">{b.name}</strong>
          <p className="tiny muted">{b.description}</p>
        </div>
      </div>
    ))
  ) : (
    <div className="empty">
      Your first badge is waiting.
      <br />
      Get an achievement verified to begin.
    </div>
  );
}
export type SubmissionRow = {
  id: string;
  title: string;
  status: string;
  pointsAwarded: number;
  createdAt: Date;
  category: { name: string };
  student?: { name: string; usn: string | null };
  reviewer?: { name: string } | null;
  escalated?: boolean;
};
export function SubmissionTable({
  rows,
  showStudent = false,
}: {
  rows: SubmissionRow[];
  showStudent?: boolean;
}) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>{showStudent ? "Student / achievement" : "Achievement"}</th>
            <th>Submitted</th>
            <th>Status</th>
            <th>Points</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id}>
              <td>
                <Link href={`/submissions/${s.id}`}>
                  <strong>{s.title}</strong>
                </Link>
                <p className="tiny muted" style={{ marginTop: 5 }}>
                  {showStudent
                    ? `${s.student?.name} · ${s.student?.usn}`
                    : s.category.name}
                </p>
              </td>
              <td className="muted">{date(s.createdAt)}</td>
              <td>
                <Status status={s.status} />
                {s.escalated && (
                  <p
                    className="tiny"
                    style={{ color: "#a16e38", marginTop: 4 }}
                  >
                    Escalated to HOD
                  </p>
                )}
              </td>
              <td>
                <strong>{s.pointsAwarded ? `+${s.pointsAwarded}` : "—"}</strong>
              </td>
              <td>
                <Link
                  aria-label={`View ${s.title}`}
                  href={`/submissions/${s.id}`}
                >
                  <ArrowUpRight size={15} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <div className="empty">No achievements here yet.</div>}
    </div>
  );
}
