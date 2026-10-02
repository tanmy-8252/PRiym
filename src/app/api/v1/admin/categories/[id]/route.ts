import { api } from "@/server/http";
import { requireUser } from "@/server/session";
import { saveCategory } from "@/server/admin";
export async function PATCH(
  r: Request,
  c: { params: Promise<{ id: string }> },
) {
  return api(r, async () =>
    saveCategory(
      await requireUser(["ADMIN"]),
      await r.json(),
      (await c.params).id,
    ),
  );
}
