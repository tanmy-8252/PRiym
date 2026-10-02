import { api } from "@/server/http";
import { requireUser } from "@/server/session";
import { db } from "@/lib/db";
import { audit } from "@/server/audit";
import { assert } from "@/lib/errors";
import { z } from "zod";
const schema = z.object({
  slaDays: z.number().int().min(1).max(30),
  weights: z
    .array(
      z.object({
        id: z.string().uuid(),
        multiplier: z.number().min(0.1).max(5),
      }),
    )
    .max(100),
});
export async function PATCH(r: Request) {
  return api(r, async () => {
    const u = await requireUser(["HOD", "ADMIN"]);
    const d = schema.parse(await r.json());
    await db.$transaction(async (tx) => {
      await tx.department.update({
        where: { id: u.departmentId },
        data: { slaDays: d.slaDays },
      });
      for (const w of d.weights) {
        const c = await tx.category.findUnique({ where: { id: w.id } });
        assert(
          c?.departmentId === u.departmentId,
          403,
          "FORBIDDEN",
          "Only categories in your department can be changed.",
        );
        await tx.category.update({
          where: { id: c.id },
          data: { multiplier: w.multiplier },
        });
      }
      await audit(
        tx,
        u,
        "DEPARTMENT_SETTINGS_UPDATED",
        "Department",
        u.departmentId,
        d,
      );
    });
    return { ok: true };
  });
}
