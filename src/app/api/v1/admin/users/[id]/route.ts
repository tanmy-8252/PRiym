import { api } from "@/server/http";
import { requireUser } from "@/server/session";
import { updateUser } from "@/server/admin";
export async function PATCH(
  r: Request,
  c: { params: Promise<{ id: string }> },
) {
  return api(r, async () =>
    updateUser(
      await requireUser(["ADMIN"]),
      (await c.params).id,
      await r.json(),
    ),
  );
}
