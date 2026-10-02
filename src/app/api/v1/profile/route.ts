import { api } from "@/server/http";
import { requireUser } from "@/server/session";
import { db } from "@/lib/db";
import { audit } from "@/server/audit";
import { z } from "zod";
const schema = z.object({
  bio: z.string().max(500),
  phone: z.string().max(25).optional(),
  linkedIn: z.union([z.literal(""), z.url().startsWith("https://")]).optional(),
  github: z.union([z.literal(""), z.url().startsWith("https://")]).optional(),
  officeHours: z.string().max(200).optional(),
  expertise: z.string().max(500).optional(),
  emailPreferences: z.array(z.string().max(150)).max(30).optional(),
  portfolioPublic: z.boolean(),
  leaderboardVisible: z.boolean(),
});
export async function PATCH(r: Request) {
  return api(r, async () => {
    const u = await requireUser();
    const d = schema.parse(await r.json());
    await db.$transaction(async (tx) => {
      await tx.user.update({ where: { id: u.id }, data: d });
      await audit(tx, u, "PROFILE_UPDATED", "User", u.id, d);
    });
    return { ok: true };
  });
}
