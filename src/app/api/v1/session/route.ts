import { api } from "@/server/http";
import { requireUser } from "@/server/session";
import { db } from "@/lib/db";
import { audit } from "@/server/audit";
import { z } from "zod";
export async function DELETE(r: Request) {
  return api(r, async () => {
    const u = await requireUser();
    await db.$transaction(async (tx) => {
      await tx.authSession.updateMany({
        where: { id: u.sessionId, userId: u.id },
        data: { revokedAt: new Date() },
      });
      await audit(tx, u, "LOGOUT", "AuthSession", u.sessionId);
    });
    return { ok: true };
  });
}

export async function GET(r: Request) {
  return api(r, async () => {
    const u = await requireUser();
    return { ok: true, sessionId: u.sessionId };
  });
}
export async function PATCH(r: Request) {
  return api(r, async () => {
    const u = await requireUser();
    const { id } = z.object({ id: z.string().uuid() }).parse(await r.json());
    await db.$transaction(async (tx) => {
      const changed = await tx.authSession.updateMany({
        where: { id, userId: u.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (changed.count)
        await audit(tx, u, "SESSION_REVOKED", "AuthSession", id);
    });
    return { ok: true };
  });
}
