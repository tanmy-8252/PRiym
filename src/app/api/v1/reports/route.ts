import { requireUser } from "@/server/session";
import { errorResponse } from "@/server/http";
import { db } from "@/lib/db";
import {
  reportFilters,
  reportWhere,
  buildReport,
  queueReport,
} from "@/server/report-jobs";
import { NextResponse } from "next/server";
export async function GET(r: Request) {
  try {
    const u = await requireUser(["STUDENT", "HOD", "ADMIN"]);
    const query = new URL(r.url).searchParams;
    const f = reportFilters.parse(
      Object.fromEntries([...query].filter(([, v]) => v !== "")),
    );
    const count =
      f.type === "audit"
        ? await db.auditLog.count({
            where: {
              createdAt: {
                ...(f.from ? { gte: new Date(f.from) } : {}),
                ...(f.to
                  ? { lt: new Date(new Date(f.to).getTime() + 86400_000) }
                  : {}),
              },
            },
          })
        : f.type === "honor"
          ? await db.honorRoll.count({
              where: {
                ...(u.role === "ADMIN" ? {} : { departmentId: u.departmentId }),
                ...(f.semester ? { semesterId: f.semester } : {}),
              },
            })
          : await db.submission.count({ where: reportWhere(u, f) });
    if (count > 500) {
      const job = await queueReport(
        u,
        new URLSearchParams(
          Object.entries(f).map(([k, v]) => [k, String(v)]),
        ).toString(),
      );
      return NextResponse.redirect(new URL(`/reports?queued=${job.id}`, r.url));
    }
    const report = await buildReport(u, f);
    return new Response(new Uint8Array(report.bytes), {
      headers: {
        "Content-Type": report.mime,
        "Content-Disposition": `attachment; filename="priym-${f.type}.${report.extension}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
