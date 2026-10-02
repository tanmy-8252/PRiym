import { pageUser } from "@/server/session";
import { getSubmission } from "@/server/submissions";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Heading, Card } from "@/components/ui";
import { AchievementForm } from "@/components/achievement-form";
export default async function Edit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const u = await pageUser(["STUDENT"]);
  const s = await getSubmission(u, (await params).id);
  if (!["DRAFT", "CLARIFICATION_REQUESTED", "REJECTED"].includes(s.status))
    redirect(`/submissions/${s.id}`);
  const cats = await db.category.findMany({
    where: {
      active: true,
      OR: [{ departmentId: u.departmentId }, { departmentId: null }],
    },
    select: { id: true, name: true, basePoints: true, subcategories: true },
  });
  const students = await db.user.findMany({
    where: {
      departmentId: u.departmentId,
      role: "STUDENT",
      status: "ACTIVE",
      id: { not: u.id },
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return (
    <>
      <Heading
        title={
          s.status === "DRAFT"
            ? "Continue your draft."
            : "Update your achievement."
        }
        description="Address the reviewer’s feedback before resubmitting."
      />
      <Card>
        <AchievementForm
          categories={cats}
          students={students}
          initial={{
            subcategory: s.subcategory,
            collaboratorIds: s.collaboratorIds,
            id: s.id,
            status: s.status,
            title: s.title,
            description: s.description,
            organization: s.organization,
            categoryId: s.categoryId,
            achievementDate: s.achievementDate.toISOString().slice(0, 10),
            level: s.level,
            position: s.position,
            externalUrl: s.externalUrl,
            evidence: s.evidence.map((e) => ({
              id: e.id,
              fileName: e.fileName,
            })),
          }}
        />
      </Card>
    </>
  );
}
