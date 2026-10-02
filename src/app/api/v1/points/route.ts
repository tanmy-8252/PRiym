import { api } from "@/server/http";
import { requireUser } from "@/server/session";
import { db } from "@/lib/db";
import { audit } from "@/server/audit";
import { evaluateBadges } from "@/server/submissions";
import { assert } from "@/lib/errors";
import { z } from "zod";
const schema = z.object({
  userId: z.string().uuid(),
  amount: z
    .number()
    .int()
    .min(-1000)
    .max(1000)
    .refine((n) => n !== 0),
  reason: z.string().trim().min(20).max(500),
});
export async function POST(r: Request) {
  return api(r, async () => {
    const u = await requireUser(["HOD", "ADMIN"]);
    const d = schema.parse(await r.json());
    return db.$transaction(async (tx) => {
      const s = await tx.user.findUnique({ where: { id: d.userId } });
      assert(
        s?.role === "STUDENT" &&
          (u.role === "ADMIN" || s.departmentId === u.departmentId),
        403,
        "FORBIDDEN",
        "Choose a student in your department.",
      );
      const semester = await tx.semester.findFirst({ where: { active: true } });
      assert(
        semester,
        422,
        "NO_SEMESTER",
        "Configure the active semester first.",
      );
      const entry = await tx.pointEntry.create({
        data: {
          userId: s.id,
          actorId: u.id,
          semesterId: semester.id,
          type: "ADJUSTED",
          amount: d.amount,
          note: d.reason,
        },
      });
      await audit(tx, u, "POINTS_ADJUSTED", "PointEntry", entry.id, d);
      await evaluateBadges(tx, s.id, u);
      await tx.notification.create({
        data: {
          userId: s.id,
          title: "Points adjustment recorded",
          body: `${d.amount} points: ${d.reason}`,
          link: "/profile",
        },
      });
      return { id: entry.id };
    });
  });
}
