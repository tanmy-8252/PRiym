import { timingSafeEqual } from "node:crypto";
import { maintenance } from "@/server/maintenance";
export async function GET(r: Request) {
  const expected = `Bearer ${process.env.CRON_SECRET || ""}`,
    actual = r.headers.get("authorization") || "";
  if (
    !process.env.CRON_SECRET ||
    actual.length !== expected.length ||
    !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
  )
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(await maintenance());
}
