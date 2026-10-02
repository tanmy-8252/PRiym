import { requireUser } from "@/server/session";
import { errorResponse } from "@/server/http";
import { db } from "@/lib/db";
import { csv } from "@/server/reports";
import { audit } from "@/server/audit";
export async function GET() {
  try {
    const u = await requireUser(["ADMIN"]);
    const logs = await db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5000,
    });
    await audit(db, u, "AUDIT_EXPORTED", "AuditLog", null, {
      count: logs.length,
    });
    return new Response(
      csv([
        [
          "Time",
          "Actor ID",
          "Role",
          "Action",
          "Entity",
          "Entity ID",
          "Metadata",
          "HMAC",
        ],
        ...logs.map((l) => [
          l.createdAt.toISOString(),
          l.actorId,
          l.actorRole,
          l.action,
          l.entityType,
          l.entityId,
          JSON.stringify(l.metadata),
          l.signature,
        ]),
      ]),
      {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=priym-audit.csv",
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
