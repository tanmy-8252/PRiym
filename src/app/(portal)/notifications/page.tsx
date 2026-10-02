import Link from "next/link";
import { pageUser } from "@/server/session";
import { db } from "@/lib/db";
import { Card, Heading, date } from "@/components/ui";
import { MarkRead } from "@/components/notification-actions";
export default async function Notifications() {
  const u = await pageUser();
  const items = await db.notification.findMany({
    where: {
      userId: u.id,
      createdAt: { gte: new Date(new Date().getTime() - 90 * 86400_000) },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <>
      <Heading
        title="Your latest updates."
        description="Decisions, feedback and milestones, all in one place."
        action={<MarkRead />}
      />
      <Card>
        {items.map((n) => (
          <div
            className="file-row"
            key={n.id}
            style={!n.readAt ? { background: "#f3f8ef" } : {}}
          >
            <div>
              <Link href={n.link || "/dashboard"}>
                <strong>{n.title}</strong>
              </Link>
              <p className="small muted" style={{ marginTop: 6 }}>
                {n.body}
              </p>
              <p className="tiny muted" style={{ marginTop: 8 }}>
                {date(n.createdAt)} · {n.readAt ? "Read" : "Unread"}
              </p>
            </div>
            {n.link && (
              <Link href={n.link} className="btn ghost">
                View ↗
              </Link>
            )}
          </div>
        ))}
        {!items.length && <div className="empty">You’re all caught up.</div>}
      </Card>
    </>
  );
}
