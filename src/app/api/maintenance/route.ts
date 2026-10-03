import { authorizedCron } from "@/server/cron-auth";
import { maintenance } from "@/server/maintenance";
export async function GET(r: Request) {
  if (!authorizedCron(r))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(await maintenance());
}
