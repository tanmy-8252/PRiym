import { api } from "@/server/http";
import {
  register,
  requestAccountLink,
  consumeAccountToken,
} from "@/server/account";
export async function POST(r: Request) {
  return api(r, async () => {
    const d = await r.json();
    if (d.action === "REGISTER") return register(d);
    if (d.action === "LINK") return requestAccountLink(d);
    return consumeAccountToken(d);
  });
}
