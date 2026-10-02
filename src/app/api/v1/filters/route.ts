import { api } from "@/server/http";
import { requireUser } from "@/server/session";
import { db } from "@/lib/db";
import { z } from "zod";
export async function POST(r: Request) {
  return api(r, async () => {
    const u = await requireUser(["HOD", "ADMIN"]),
      d = z
        .object({
          label: z.string().trim().min(2).max(60),
          query: z.string().max(2000),
        })
        .parse(await r.json());
    return db.savedFilter.upsert({
      where: { userId_label: { userId: u.id, label: d.label } },
      create: { userId: u.id, ...d },
      update: { query: d.query },
    });
  });
}
export async function DELETE(r: Request) {
  return api(r, async () => {
    const u = await requireUser(["HOD", "ADMIN"]),
      d = z.object({ id: z.string().uuid() }).parse(await r.json());
    await db.savedFilter.deleteMany({ where: { id: d.id, userId: u.id } });
    return { ok: true };
  });
}
