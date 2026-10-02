import { pageUser } from "@/server/session";
import { db } from "@/lib/db";
import { Card, Heading, Status } from "@/components/ui";
import {
  AccountActions,
  CreateUserForm,
  CategoryForm,
} from "@/components/admin-forms";
import Link from "next/link";
import { InstitutionForm } from "@/components/institution-controls";
export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const q = await searchParams,
    page = Math.max(1, Math.floor(Number(q.page) || 1));
  const where = q.q
    ? {
        OR: [
          { name: { contains: q.q, mode: "insensitive" as const } },
          { email: { contains: q.q, mode: "insensitive" as const } },
          { usn: { contains: q.q, mode: "insensitive" as const } },
        ],
      }
    : {};
  const count = await db.user.count({ where });
  await pageUser(["ADMIN"]);
  const [users, categories, departments] = await Promise.all([
    db.user.findMany({
      include: { department: true },
      orderBy: { createdAt: "desc" },
      where,
      skip: (page - 1) * 25,
      take: 25,
    }),
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.department.findMany(),
  ]);
  const faculty = await db.user.findMany({
    where: { role: "FACULTY", status: "ACTIVE" },
    select: { id: true, name: true, departmentId: true },
  });
  return (
    <>
      <Heading
        title="Build a fair system."
        description="Manage access, mentors and recognition rules."
      />
      <div className="stack">
        <Card title="Create an account">
          <CreateUserForm departments={departments} />
        </Card>
        <Card title="User accounts">
          <form className="filters">
            <input
              name="q"
              aria-label="Search accounts"
              defaultValue={q.q}
              placeholder="Name, email or USN"
            />
            <button className="btn secondary">Search</button>
          </form>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name / email</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Account controls</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.name}</strong>
                      <p className="tiny muted">
                        {u.email} · {u.usn ?? u.role}
                      </p>
                    </td>
                    <td>{u.department.code}</td>
                    <td>
                      <Status status={u.status} />
                    </td>
                    <td>
                      <AccountActions
                        id={u.id}
                        status={u.status}
                        role={u.role}
                        mentorId={u.mentorId}
                        faculty={faculty.filter(
                          (f) => f.departmentId === u.departmentId,
                        )}
                      />
                      <details>
                        <summary>Security & login history</summary>
                        <InstitutionForm
                          action="FORCE_RESET"
                          id={u.id}
                          button="Send password reset & revoke sessions"
                          fields={[]}
                        />
                        <Link href={`/audit?q=${u.id}`}>
                          View audit history
                        </Link>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="tiny muted" style={{ marginTop: 15 }}>
            Users must verify their institutional email before activation. Role
            or status changes revoke active sessions.
          </p>
          <div className="form-actions">
            <span className="small muted">
              Page {page} · {count} accounts
            </span>
            {page > 1 && (
              <Link
                className="btn secondary"
                href={`/admin?page=${page - 1}&q=${encodeURIComponent(q.q || "")}`}
              >
                Previous
              </Link>
            )}
            {page * 25 < count && (
              <Link
                className="btn secondary"
                href={`/admin?page=${page + 1}&q=${encodeURIComponent(q.q || "")}`}
              >
                Next
              </Link>
            )}
          </div>
        </Card>
        <Card title="Create a recognition category">
          <CategoryForm />
        </Card>
        {categories.map((c) => (
          <Card
            title={`${c.name} · ${c.active ? "Active" : "Archived"}`}
            key={c.id}
          >
            <CategoryForm
              initial={{
                id: c.id,
                name: c.name,
                description: c.description,
                basePoints: c.basePoints,
                multiplier: Number(c.multiplier),
                checklist: c.checklist,
                requiresPosition: c.requiresPosition,
                active: c.active,
                subcategories: c.subcategories,
                programOutcomes: c.programOutcomes,
                naacIndicator: c.naacIndicator,
                rejectionCodes: c.rejectionCodes,
              }}
            />
          </Card>
        ))}
      </div>
    </>
  );
}
