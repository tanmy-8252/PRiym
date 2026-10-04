import { authorizedCron } from "@/server/cron-auth";
import { deliverMail } from "@/server/mail";
import { cleanupExpiredUploads } from "@/server/evidence";

export const maxDuration = 60;
export async function GET(request: Request) {
  if (!authorizedCron(request))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const email = await deliverMail();
  const expiredUploads = await cleanupExpiredUploads();
  return Response.json(
    { ...email, expiredUploads },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
