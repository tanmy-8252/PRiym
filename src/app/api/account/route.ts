import { api } from "@/server/http";
import {
  register,
  requestAccountLink,
  consumeAccountToken,
} from "@/server/account";
import { after } from "next/server";
import { deliverMail } from "@/server/mail";

export const maxDuration = 60;
function scheduleMail(ids: string[]) {
  if (!ids.length) return;
  after(async () => {
    try {
      const result = await deliverMail(ids);
      if (result.failed) console.error("PRiym account email queued for retry");
    } catch {
      console.error(
        "PRiym account email delivery interrupted; the outbox retains the message for retry",
      );
    }
  });
}
export async function POST(r: Request) {
  return api(r, async () => {
    const d = await r.json();
    if (d.action === "REGISTER") return register(d, scheduleMail);
    if (d.action === "LINK") return requestAccountLink(d, scheduleMail);
    return consumeAccountToken(d, scheduleMail);
  });
}
