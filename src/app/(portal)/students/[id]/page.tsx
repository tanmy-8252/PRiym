import { pageUser } from "@/server/session";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Heading, Card, SubmissionTable, BadgeWall } from "@/components/ui";
export default async function Student({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const u = await pageUser(["FACULTY", "HOD", "ADMIN"]),
    id = (await params).id;
  const student = await db.user.findFirst({
    where: {
      id,
      role: "STUDENT",
      ...(u.role === "ADMIN" ? {} : { departmentId: u.departmentId }),
      ...(u.role === "FACULTY" ? { mentorId: u.id } : {}),
    },
    include: {
      department: true,
      badges: { where: { revokedAt: null }, include: { badge: true } },
    },
  });
  if (!student) notFound();
  const rows = await db.submission.findMany({
    where: { studentId: id, status: { not: "DRAFT" } },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  const total = await db.pointEntry.aggregate({
    where: { userId: id },
    _sum: { amount: true },
  });
  return (
    <>
      <Heading
        title={student.name}
        description={`${student.usn} · ${student.department.name} · ${total._sum.amount || 0} points`}
      />
      <div className="stack">
        <Card title="Merit profile">
          <p>{student.bio || "No bio added."}</p>
          <BadgeWall badges={student.badges.map((b) => b.badge)} />
        </Card>
        <Card title="Achievement history">
          <SubmissionTable rows={rows} />
        </Card>
      </div>
    </>
  );
}
