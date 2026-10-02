import { pageUser } from "@/server/session";
import { db } from "@/lib/db";
import { Logo, label } from "@/components/ui";
import { Nav, Logout } from "@/components/navigation";
import { Bell, GraduationCap } from "lucide-react";
import Link from "next/link";
import { GlobalSearch } from "@/components/search-controls";
import { InactivityWarning } from "@/components/security-controls";
export const dynamic = "force-dynamic";
export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const u = await pageUser();
  const unread = await db.notification.count({
    where: { userId: u.id, readAt: null },
  });
  const initials = u.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("");
  return (
    <div className="shell">
      <InactivityWarning />
      <aside className="sidebar">
        <Link href="/dashboard">
          <Logo />
        </Link>
        <p className="brand-caption">Progress. Recognition. Merit.</p>
        <p className="nav-label">{label(u.role)} WORKSPACE</p>
        <Nav role={u.role} />
        <div className="sidebar-bottom">
          <div className="user-row">
            <div className="avatar">{initials}</div>
            <div>
              <strong className="small">{u.name}</strong>
              <p className="tiny muted">
                {u.department.code} · {label(u.role)}
              </p>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <Logout />
          </div>
        </div>
      </aside>
      <div className="app-body">
        <header className="topbar">
          <div className="topbar-path">
            Workspace{" "}
            <span style={{ margin: "0 10px", color: "#c4cec5" }}>/</span>{" "}
            {label(u.role)} portal
          </div>
          <details className="mobile-nav">
            <summary>PRiym. ☰</summary>
            <nav className="mobile-links">
              <Nav role={u.role} />
              <Logout />
            </nav>
          </details>
          {u.role !== "STUDENT" && <GlobalSearch />}
          <div className="user-row">
            <span
              className="small muted"
              style={{ display: "flex", gap: 6, alignItems: "center" }}
            >
              <GraduationCap size={16} /> Atria Institute of Technology
            </span>
            <Link
              href="/notifications"
              className="btn ghost"
              aria-label={`${unread} unread notifications`}
            >
              <Bell size={17} />
              {unread > 0 && <span className="tiny">{unread}</span>}
            </Link>
            <div className="avatar">{initials}</div>
          </div>
        </header>
        <main className="content">
          {children}
          <footer className="footer-note">
            <span>PRiym · Progress, Recognition, Innovation & Merit</span>
            <span>{u.department.code} · Atria Institute of Technology</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
