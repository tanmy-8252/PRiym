import { pageUser } from "@/server/session";
import { db } from "@/lib/db";
import { Card, Heading, date } from "@/components/ui";
export default async function Audit({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await pageUser(["ADMIN"]);
  const q = await searchParams;
  const logs = await db.auditLog.findMany({
    where: q.action
      ? { action: { contains: q.action, mode: "insensitive" } }
      : {},
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const actors = await db.user.findMany({
    where: {
      id: { in: logs.map((l) => l.actorId).filter((x): x is string => !!x) },
    },
    select: { id: true, name: true },
  });
  return (
    <>
      <Heading
        title="An accountable record."
        description="Signed, append-only records of platform actions."
        action={
          <a className="btn secondary" href="/api/v1/audit">
            Export CSV
          </a>
        }
      />
      <Card>
        <form className="filters">
          <input
            className="filter-input"
            name="action"
            aria-label="Search audit action"
            placeholder="Filter by action, e.g. APPROVE…"
            defaultValue={q.action}
          />
          <button className="btn secondary">Search</button>
        </form>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Signature</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td>
                    {date(l.createdAt)}
                    <p className="tiny muted">
                      {l.createdAt.toLocaleTimeString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      })}
                    </p>
                  </td>
                  <td>
                    {actors.find((a) => a.id === l.actorId)?.name ?? "System"}
                    <p className="tiny muted">{l.actorRole}</p>
                  </td>
                  <td>
                    <strong>{l.action}</strong>
                  </td>
                  <td>
                    {l.entityType}
                    <p className="tiny muted">{l.entityId?.slice(0, 8)}</p>
                  </td>
                  <td>
                    <code className="tiny">{l.signature.slice(0, 14)}…</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="tiny muted" style={{ marginTop: 15 }}>
          Showing the 100 most recent matching entries. Records are HMAC-signed
          for tamper detection.
        </p>
      </Card>
    </>
  );
}
