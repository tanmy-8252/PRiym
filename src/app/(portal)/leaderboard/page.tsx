import { pageUser } from "@/server/session";
import { db } from "@/lib/db";
import { leaderboard } from "@/server/analytics";
import { Card, Heading } from "@/components/ui";
import { Trophy } from "lucide-react";
export default async function Leaderboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const u = await pageUser();
  const q = await searchParams;
  const semesters = await db.semester.findMany({
    orderBy: { startDate: "desc" },
  });
  const active = semesters.find((s) => s.active);
  const semesterId =
    q.semester === "all" ? undefined : q.semester || active?.id;
  const cats = await db.category.findMany({
    where: {
      active: true,
      OR: [{ departmentId: u.departmentId }, { departmentId: null }],
    },
  });
  const rows = await leaderboard(u, {
    semesterId,
    batch: q.batch ? Number(q.batch) : undefined,
    categoryId: q.category || undefined,
  });
  const me = rows.find((r) => r.id === u.id);
  return (
    <>
      <Heading
        title="Effort worth celebrating."
        description="Recognition earned through verified achievements. Keep moving forward."
      />
      <Card>
        <form className="filters">
          <select
            name="semester"
            aria-label="Leaderboard semester"
            className="filter-input"
            defaultValue={q.semester ?? active?.id}
          >
            <option value="all">All time</option>
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            name="batch"
            aria-label="Leaderboard batch"
            className="filter-input"
            defaultValue={q.batch ?? ""}
          >
            <option value="">All batches</option>
            {Array.from(new Set(rows.map((r) => r.batchYear)))
              .sort()
              .map((b) => (
                <option key={b} value={b ?? ""}>
                  {b}
                </option>
              ))}
          </select>
          <select
            name="category"
            aria-label="Leaderboard category"
            className="filter-input"
            defaultValue={q.category ?? ""}
          >
            <option value="">All categories</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button className="btn secondary">Apply filters</button>
        </form>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student</th>
                <th>Batch</th>
                <th>Badges</th>
                <th>Verified points</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 100).map((r) => (
                <tr
                  key={r.id}
                  style={r.id === u.id ? { background: "#f2f8ef" } : {}}
                >
                  <td>
                    <span
                      style={{ display: "flex", gap: 9, alignItems: "center" }}
                    >
                      {r.rank <= 3 && <Trophy size={16} color="#b69a4a" />}#
                      {r.rank}
                    </span>
                  </td>
                  <td>
                    <strong>
                      {r.name}
                      {r.id === u.id ? " (you)" : ""}
                    </strong>
                    <p className="tiny muted">{r.usn}</p>
                  </td>
                  <td>{r.batchYear}</td>
                  <td>{r.badges}</td>
                  <td>
                    <strong>{r.points}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {me && (
          <div className="notice small">
            Your position: #{me.rank} · {me.points} verified points
          </div>
        )}
        <p className="tiny muted" style={{ marginTop: 20 }}>
          Live database results ·{" "}
          {new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} ·
          Rankings use verified points. Equal points share a rank.
        </p>
      </Card>
    </>
  );
}
