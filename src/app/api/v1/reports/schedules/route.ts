import { api } from "@/server/http";
import { requireUser } from "@/server/session";
import { db } from "@/lib/db";
import { assert } from "@/lib/errors";
import { reportFilters, checkReportAccess } from "@/server/report-jobs";
import { audit } from "@/server/audit";
import { z } from "zod";
export async function POST(r: Request) {
  return api(r, async () => {
    const u = await requireUser(["HOD", "ADMIN"]),
      raw = await r.json();
    if (raw.action === "DELETE") {
      const id = z.string().uuid().parse(raw.id);
      await db.reportSchedule.deleteMany({ where: { id, userId: u.id } });
      return { ok: true };
    }
    const d = z
      .object({
        query: z.string().max(2000),
        frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
        recipients: z.array(z.email()).max(20),
      })
      .parse(raw);
    const f = reportFilters.parse(
      Object.fromEntries(new URLSearchParams(d.query)),
    );
    checkReportAccess(u, f);
    for (const email of d.recipients) {
      assert(
        await db.user.findFirst({
          where: {
            email,
            status: "ACTIVE",
            role: { in: u.role === "ADMIN" ? ["ADMIN"] : ["HOD", "ADMIN"] },
            ...(u.role === "HOD" ? { departmentId: u.departmentId } : {}),
          },
        }),
        422,
        "RECIPIENT",
        "Recipients must be active HOD/Admin accounts within your reporting scope.",
      );
    }
    const schedule = await db.reportSchedule.create({
      data: { userId: u.id, ...d, nextRunAt: new Date() },
    });
    await audit(db, u, "REPORT_SCHEDULED", "ReportSchedule", schedule.id, {
      frequency: d.frequency,
    });
    return { id: schedule.id };
  });
}
