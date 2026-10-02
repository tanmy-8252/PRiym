import { api } from "@/server/http";
import { requireUser } from "@/server/session";
import { db } from "@/lib/db";
import { audit } from "@/server/audit";
import { passwordSchema } from "@/lib/validation";
import { assert } from "@/lib/errors";
import { compare, hash } from "bcryptjs";
import { z } from "zod";
const schema = z.object({
  action: z.enum(["PASSWORD", "REVOKE_ALL"]),
  currentPassword: z.string(),
  newPassword: z.string().optional(),
});
export async function POST(r: Request) {
  return api(r, async () => {
    const u = await requireUser();
    const d = schema.parse(await r.json());
    assert(
      await compare(d.currentPassword, u.passwordHash),
      422,
      "WRONG_PASSWORD",
      "Current password is incorrect.",
    );
    return db.$transaction(async (tx) => {
      if (d.action === "PASSWORD") {
        const p = passwordSchema.parse(d.newPassword);
        const history = await tx.passwordHistory.findMany({
          where: { userId: u.id },
          orderBy: { createdAt: "desc" },
          take: 4,
        });
        for (const h of [{ hash: u.passwordHash }, ...history])
          assert(
            !(await compare(p, h.hash)),
            422,
            "PASSWORD_REUSE",
            "Choose a password different from your last five passwords.",
          );
        await tx.passwordHistory.create({
          data: { userId: u.id, hash: u.passwordHash },
        });
        await tx.user.update({
          where: { id: u.id },
          data: { passwordHash: await hash(p, 12) },
        });
      }
      await tx.authSession.updateMany({
        where: { userId: u.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await audit(
        tx,
        u,
        d.action === "PASSWORD" ? "PASSWORD_CHANGED" : "SESSIONS_REVOKED",
        "User",
        u.id,
      );
      return { ok: true };
    });
  });
}
