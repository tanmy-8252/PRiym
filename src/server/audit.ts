import { randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { requestContext } from "./request-context";
import { signAudit } from "@/lib/audit-signature";
type Actor = { id: string; role: string; departmentId: string };
export function audit(
  tx: Prisma.TransactionClient,
  actor: Actor | null,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: Prisma.InputJsonValue = {},
) {
  const id = randomUUID(),
    createdAt = new Date();
  const payload = {
    id,
    actorId: actor?.id ?? null,
    actorRole: actor?.role ?? "SYSTEM",
    departmentId: actor?.departmentId ?? null,
    action,
    entityType,
    entityId,
    metadata,
    createdAt: createdAt.toISOString(),
    ipAddress: requestContext.getStore()?.ipAddress || "",
    userAgent: requestContext.getStore()?.userAgent || "",
  };
  const secret = process.env.AUDIT_SECRET;
  if (!secret) throw new Error("AUDIT_SECRET is required");
  const signature = signAudit(payload, secret);
  return tx.auditLog.create({ data: { ...payload, createdAt, signature } });
}
