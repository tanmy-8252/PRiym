import { api } from "@/server/http";
import { requireUser } from "@/server/session";
import { importUsers } from "@/server/configuration";
export async function POST(r: Request) {
  return api(r, async () =>
    importUsers(await requireUser(["ADMIN"]), await r.json()),
  );
}
