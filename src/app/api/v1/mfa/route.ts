import { api } from "@/server/http";
import { requireUser } from "@/server/session";
import { manageMfa } from "@/server/account";
export async function POST(r: Request) {
  return api(r, async () => manageMfa(await requireUser(), await r.json()));
}
