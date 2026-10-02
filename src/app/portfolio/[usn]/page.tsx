import { db } from "@/lib/db";
import { Card, Heading, Logo, BadgeWall, date } from "@/components/ui";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Portfolio({
  params,
}: {
  params: Promise<{ usn: string }>;
}) {
  const u = await db.user.findFirst({
    where: {
      usn: (await params).usn,
      role: "STUDENT",
      status: "ACTIVE",
      portfolioPublic: true,
    },
    select: {
      name: true,
      bio: true,
      batchYear: true,
      department: { select: { name: true } },
      submissions: {
        where: { status: "APPROVED" },
        select: {
          id: true,
          title: true,
          description: true,
          organization: true,
          achievementDate: true,
          category: { select: { name: true } },
          pointsAwarded: true,
        },
        orderBy: { achievementDate: "desc" },
      },
      badges: {
        where: { revokedAt: null },
        select: { badge: { select: { name: true, description: true } } },
      },
    },
  });
  if (!u) notFound();
  return (
    <main className="content" style={{ maxWidth: 1000 }}>
      <Logo />
      <div style={{ marginTop: 45 }}>
        <Heading
          eyebrow="Verified achievement portfolio"
          title={u.name}
          description={`${u.department.name} · Batch ${u.batchYear}`}
        />
      </div>
      <p className="muted" style={{ marginBottom: 24 }}>
        {u.bio}
      </p>
      <div className="stack">
        <Card title="Recognition">
          <BadgeWall badges={u.badges.map((b) => b.badge)} />
        </Card>
        {u.submissions.map((s) => (
          <Card key={s.id} title={s.title}>
            <p className="small muted" style={{ marginBottom: 12 }}>
              {s.category.name} · {s.organization} · {date(s.achievementDate)} ·{" "}
              {s.pointsAwarded} verified points
            </p>
            <p>{s.description}</p>
          </Card>
        ))}
      </div>
      <p className="tiny muted" style={{ marginTop: 25 }}>
        Verified through PRiym · Atria Institute of Technology. Supporting
        documents are kept private.
      </p>
    </main>
  );
}
