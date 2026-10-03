import { authorizedCron } from "@/server/cron-auth";
import { deliverMail } from "@/server/mail";

export const maxDuration = 60;
export async function GET(request: Request) {
  if (!authorizedCron(request))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(await deliverMail(), {
    headers: { "Cache-Control": "no-store" },
  });
}
