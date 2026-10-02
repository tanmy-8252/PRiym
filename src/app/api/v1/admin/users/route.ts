import { api } from "@/server/http";
import { requireUser } from "@/server/session";
import { createUser } from "@/server/admin";
export async function POST(r: Request) {
  return api(r, async () =>
    createUser(await requireUser(["ADMIN"]), await r.json()),
  );
}

import { db } from "@/lib/db";
import { csv } from "@/server/reports";
import { errorResponse } from "@/server/http";
import { audit } from "@/server/audit";
export async function GET() {
  try {
    const u = await requireUser(["ADMIN"]);
    const rows = await db.user.findMany({
      select: {
        name: true,
        email: true,
        usn: true,
        role: true,
        status: true,
        batchYear: true,
        departmentId: true,
        mentorId: true,
      },
    });
    await audit(db, u, "USERS_EXPORTED", "User", null, { count: rows.length });
    return new Response(
      csv([
        [
          "name",
          "email",
          "usn",
          "role",
          "status",
          "batchYear",
          "departmentId",
          "mentorId",
        ],
        ...rows.map((x) => Object.values(x)),
      ]),
      {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=priym-users.csv",
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
