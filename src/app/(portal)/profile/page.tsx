import Link from "next/link";
import { pageUser } from "@/server/session";
import { db } from "@/lib/db";
import { Card, Heading, BadgeWall, date, label } from "@/components/ui";
import { ProfileForm, SecurityForm } from "@/components/profile-form";
import { MfaControls, SessionRevoke } from "@/components/security-controls";
export default async function Profile() {
  const u = await pageUser();
  const [badges, ledger, sessions] = await Promise.all([
    db.userBadge.findMany({
      where: { userId: u.id, revokedAt: null },
      include: { badge: true },
    }),
    db.pointEntry.findMany({
      where: { userId: u.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.authSession.findMany({
      where: {
        userId: u.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
        lastSeenAt: { gt: new Date(new Date().getTime() - 30 * 60_000) },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return (
    <>
      <Heading
        title="Your story, taking shape."
        description={`${u.name} · ${u.usn ?? label(u.role)} · ${u.department.name}`}
        action={
          u.usn && u.portfolioPublic ? (
            <Link
              className="btn secondary"
              href={`/portfolio/${u.usn}`}
              target="_blank"
            >
              View public portfolio ↗
            </Link>
          ) : undefined
        }
      />
      <div className="columns">
        <div className="stack">
          <Card title="Profile & visibility">
            <ProfileForm
              details={{
                phone: u.phone,
                linkedIn: u.linkedIn,
                github: u.github,
                officeHours: u.officeHours,
                expertise: u.expertise,
                emailPreferences: u.emailPreferences,
              }}
              bio={u.bio}
              portfolioPublic={u.portfolioPublic}
              leaderboardVisible={u.leaderboardVisible}
            />
          </Card>
          <Card title="Points ledger">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Recognition</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((l) => (
                    <tr key={l.id}>
                      <td>{date(l.createdAt)}</td>
                      <td>{l.note}</td>
                      <td>
                        {l.amount > 0 ? "+" : ""}
                        {l.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!ledger.length && (
                <p className="empty">
                  Verified achievements will add to your ledger.
                </p>
              )}
            </div>
          </Card>
          <Card title="Account security">
            <SecurityForm />
          </Card>
        </div>
        <div className="stack">
          <Card title="Multi-factor authentication">
            <MfaControls
              enabled={!!u.mfaSecret}
              required={["HOD", "ADMIN"].includes(u.role)}
            />
          </Card>
          <Card title="Your badges">
            <BadgeWall badges={badges.map((b) => b.badge)} />
          </Card>
          <Card title="Active sessions">
            {sessions.map((s) => (
              <div className="file-row" key={s.id}>
                <div>
                  <strong className="small">
                    {s.id === u.sessionId ? "This session" : "Another session"}
                  </strong>
                  <p className="tiny muted">
                    Started {date(s.createdAt)} · Expires {date(s.expiresAt)}
                    <br />
                    {s.userAgent || "Device information unavailable"}
                  </p>
                </div>
                {s.id !== u.sessionId && <SessionRevoke id={s.id} />}
              </div>
            ))}
            <p className="tiny muted" style={{ marginTop: 15 }}>
              Sessions expire after 30 minutes without requests. Use account
              security to sign out all sessions.
            </p>
            <p className="tiny muted" style={{ marginTop: 12 }}>
              MFA: {u.mfaSecret ? "Enabled" : "Not enabled"}
              {["HOD", "ADMIN"].includes(u.role)
                ? " · Required for your role"
                : ""}
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
