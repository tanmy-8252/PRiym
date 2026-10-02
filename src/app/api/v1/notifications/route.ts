import { api } from "@/server/http";
import { requireUser } from "@/server/session";
import { db } from "@/lib/db";
export async function POST(r: Request) {
  return api(r, async () => {
    const u = await requireUser();
    await db.notification.updateMany({
      where: { userId: u.id, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  });
}
