import { api } from "@/server/http";
import { requireUser } from "@/server/session";
import { saveCategory } from "@/server/admin";
export async function POST(r: Request) {
  return api(r, async () =>
    saveCategory(await requireUser(["ADMIN"]), await r.json()),
  );
}
