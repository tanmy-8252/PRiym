"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ClipboardList,
  Trophy,
  FileBarChart2,
  Settings2,
  Bell,
  Users,
  LogOut,
  Shield,
} from "lucide-react";
import { signOut } from "next-auth/react";
const icons = {
  dashboard: LayoutDashboard,
  submissions: ClipboardList,
  leaderboard: Trophy,
  reports: FileBarChart2,
  profile: Settings2,
  notifications: Bell,
  admin: Users,
  audit: Shield,
  settings: Settings2,
  institution: Settings2,
};
export function Nav({ role }: { role: string }) {
  const path = usePathname();
  const links = [
    { key: "dashboard", label: "Overview" },
    {
      key: "submissions",
      label:
        role === "STUDENT"
          ? "My achievements"
          : role === "FACULTY"
            ? "Verification queue"
            : "Achievements",
    },
    { key: "leaderboard", label: "Leaderboard" },
    { key: "reports", label: "Reports" },
    { key: "notifications", label: "Notifications" },
    { key: "profile", label: "My profile" },
    ...(["HOD", "ADMIN"].includes(role)
      ? [{ key: "settings", label: "Recognition settings" }]
      : []),
    ...(role === "ADMIN"
      ? [
          { key: "admin", label: "Administration" },
          { key: "institution", label: "Institution controls" },
          { key: "audit", label: "Audit trail" },
        ]
      : []),
  ] as { key: keyof typeof icons; label: string }[];
  return (
    <>
      {links.map((l) => {
        const Icon = icons[l.key];
        return (
          <Link
            key={l.key}
            className={`nav-link ${path === `/${l.key}` || (l.key === "submissions" && path.startsWith("/submissions/")) ? "active" : ""}`}
            href={`/${l.key}`}
          >
            <Icon size={17} />
            {l.label}
          </Link>
        );
      })}
    </>
  );
}
export function Logout() {
  return (
    <button
      className="btn ghost"
      onClick={async () => {
        await fetch("/api/v1/session", { method: "DELETE" });
        await signOut({ callbackUrl: "/login" });
      }}
    >
      <LogOut size={14} /> Sign out
    </button>
  );
}
