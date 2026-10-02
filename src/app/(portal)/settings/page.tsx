import { pageUser } from "@/server/session";
import { db } from "@/lib/db";
import { Heading, Card } from "@/components/ui";
import {
  DepartmentSettings,
  PointAdjustment,
  BadgeForm,
} from "@/components/recognition-settings";
export default async function Settings() {
  const u = await pageUser(["HOD", "ADMIN"]);
  const categories = await db.category.findMany({
    where: { departmentId: u.departmentId },
  });
  const students = await db.user.findMany({
    where: { role: "STUDENT", departmentId: u.departmentId },
    select: { id: true, name: true },
  });
  return (
    <>
      <Heading
        title="Recognition, with intention."
        description="Configure department weights, review timelines and justified point adjustments."
      />
      <div className="stack">
        <Card title="Department rules">
          <DepartmentSettings
            slaDays={u.department.slaDays}
            categories={categories.map((c) => ({
              id: c.id,
              name: c.name,
              multiplier: Number(c.multiplier),
            }))}
          />
        </Card>
        <Card title="Manual points adjustment">
          <PointAdjustment students={students} />
        </Card>
        {u.role === "ADMIN" && (
          <Card title="New milestone badge">
            <BadgeForm />
          </Card>
        )}
      </div>
    </>
  );
}
