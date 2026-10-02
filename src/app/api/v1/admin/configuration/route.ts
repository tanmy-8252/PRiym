import { api } from "@/server/http";
import { requireUser } from "@/server/session";
import { configure } from "@/server/configuration";
export async function POST(r: Request) {
  return api(r, async () =>
    configure(await requireUser(["ADMIN"]), await r.json()),
  );
}
