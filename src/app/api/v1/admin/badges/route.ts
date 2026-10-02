import { api } from "@/server/http";
import { requireUser } from "@/server/session";
import { db } from "@/lib/db";
import { audit } from "@/server/audit";
import { z } from "zod";
const schema = z.object({
  name: z.string().trim().min(3).max(100),
  description: z.string().min(10).max(500),
  threshold: z.number().int().nonnegative().max(100000),
});
export async function POST(r: Request) {
  return api(r, async () => {
    const u = await requireUser(["ADMIN"]);
    const d = schema.parse(await r.json());
    return db.$transaction(async (tx) => {
      const b = await tx.badge.create({ data: d });
      await audit(tx, u, "BADGE_CREATED", "Badge", b.id, d);
      return { id: b.id };
    });
  });
}
export async function PATCH(r: Request) {
  return api(r, async () => {
    const u = await requireUser(["ADMIN"]),
      raw = await r.json();
    return db.$transaction(async (tx) => {
      if (raw.action === "REVOKE") {
        const d = z
          .object({
            badgeId: z.string().uuid(),
            userId: z.string().uuid(),
            reason: z.string().min(20).max(1000),
          })
          .parse(raw);
        await tx.userBadge.update({
          where: { userId_badgeId: { userId: d.userId, badgeId: d.badgeId } },
          data: { revokedAt: new Date() },
        });
        await audit(tx, u, "BADGE_REVOKED", "Badge", d.badgeId, {
          userId: d.userId,
          reason: d.reason,
        });
        return { ok: true };
      }
      const d = schema
        .extend({
          id: z.string().uuid(),
          active: z.boolean(),
          ruleType: z.enum([
            "MILESTONE",
            "ACHIEVEMENT",
            "ACTIVITY",
            "STREAK",
            "SEMESTER",
          ]),
          categoryId: z.string().uuid().nullable(),
        })
        .parse(raw);
      const { id, ...data } = d;
      await tx.badge.update({ where: { id }, data });
      await audit(tx, u, "BADGE_UPDATED", "Badge", id, data);
      return { ok: true };
    });
  });
}
