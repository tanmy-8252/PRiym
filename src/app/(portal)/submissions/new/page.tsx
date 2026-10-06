import { pageUser } from "@/server/session";
import { db } from "@/lib/db";
import { Heading, Card } from "@/components/ui";
import { AchievementForm } from "@/components/achievement-form";
export default async function NewSubmission() {
  const u = await pageUser(["STUDENT"]);
  const categories = await db.category.findMany({
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
      removedAt: null,
      id: { not: u.id },
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return (
    <>
      <Heading
        title="Make it count."
        description="Share your achievement. We’ll help turn it into recognition."
      />
      <div className="columns">
        <Card title="Achievement details">
          <AchievementForm categories={categories} students={students} />
        </Card>
        <Card title="A good submission starts here">
          <div className="stack">
            <p className="small muted">
              01 · Choose the category and level that best match your
              accomplishment.
            </p>
            <p className="small muted">
              02 · Attach readable evidence showing your name, date and result.
            </p>
            <p className="small muted">
              03 · Your faculty mentor verifies the achievement and awards
              points.
            </p>
            <div className="notice small">
              Points = category base × achievement level × department weight.
              You’ll see the final amount after approval.
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
