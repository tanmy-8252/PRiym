import "../src/lib/env";
import { db } from "../src/lib/db";
import {
  canonicalJson,
  matchesSignature,
  legacyJsonVariants,
} from "../src/lib/audit-signature";
let failed = 0,
  total = 0;
for (const row of await db.auditLog.findMany({
  orderBy: { createdAt: "asc" },
})) {
  const payload = {
    id: row.id,
    actorId: row.actorId,
    actorRole: row.actorRole,
    departmentId: row.departmentId,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    metadata: row.metadata,
    createdAt: row.createdAt.toISOString(),
  };
  const variants = [
    payload,
    { ...payload, ipAddress: row.ipAddress, userAgent: row.userAgent },
  ];
  const secret = process.env.AUDIT_SECRET!;
  let valid = matchesSignature(
    canonicalJson(variants[1]),
    row.signature,
    secret,
  );
  if (!valid)
    for (const p of variants) {
      for (const metadata of legacyJsonVariants(row.metadata)) {
        const serialized = JSON.stringify({
          ...p,
          metadata: "__LEGACY_METADATA_PLACEHOLDER__",
        }).replace('"__LEGACY_METADATA_PLACEHOLDER__"', metadata);
        if (matchesSignature(serialized, row.signature, secret)) {
          valid = true;
          break;
        }
      }
      if (valid) break;
    }
  if (!valid) {
    console.error("Invalid audit signature:", row.id);
    failed++;
  }
  total++;
}
console.log(`${total} audit entries checked; ${failed} failed.`);
await db.$disconnect();
if (failed) process.exitCode = 1;
