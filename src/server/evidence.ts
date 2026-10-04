import { randomUUID } from "node:crypto";
import path from "node:path";
import { z } from "zod";
import { db } from "@/lib/db";
import { assert } from "@/lib/errors";
import type { User } from "@/generated/prisma/client";
import { evidenceMimeType, fileValidationError } from "@/lib/evidence-files";
import { audit } from "./audit";
import {
  discardEvidence,
  requireUploadStorage,
  signedEvidenceUpload,
  stagedEvidence,
  storeEvidence,
} from "./storage";

const metadataSchema = z.object({
  fileName: z.string().trim().min(1).max(200),
  mimeType: z.string().max(100),
  sizeBytes: z.number().int().positive(),
});
const evidenceSummary = (e: {
  id: string;
  fileName: string;
  sizeBytes: number;
}) => ({ id: e.id, fileName: e.fileName, sizeBytes: e.sizeBytes });

export async function prepareEvidenceUpload(user: User, raw: unknown) {
  assert(
    user.role === "STUDENT",
    403,
    "FORBIDDEN",
    "Only students can upload achievement evidence.",
  );
  const metadata = metadataSchema.parse(raw);
  const mimeType = evidenceMimeType(metadata.fileName, metadata.mimeType);
  const error = fileValidationError(
    metadata.fileName,
    mimeType,
    metadata.sizeBytes,
  );
  assert(!error, 422, "INVALID_FILE", error || "Invalid file.");
  await requireUploadStorage();
  if (process.env.STORAGE_PROVIDER !== "supabase")
    return { transport: "server" as const };
  // Reserve before issuing a capability so failed uploads also count toward the limit.
  const upload = await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`upload:${user.id}`}))`;
    const since = new Date(Date.now() - 3600_000);
    const recent = await tx.evidenceUpload.count({
      where: { ownerId: user.id, createdAt: { gte: since } },
    });
    assert(
      recent < 50,
      429,
      "UPLOAD_LIMIT",
      "Please wait before uploading more documents.",
    );
    return tx.evidenceUpload.create({
      data: {
        ownerId: user.id,
        fileName: path.basename(metadata.fileName).replace(/[\r\n"\\]/g, "_"),
        mimeType,
        sizeBytes: metadata.sizeBytes,
        storageKey: `quarantine/${user.id}/${randomUUID()}`,
        expiresAt: new Date(Date.now() + 2 * 3600_000),
      },
    });
  });
  try {
    return {
      transport: "direct" as const,
      id: upload.id,
      uploadUrl: await signedEvidenceUpload(upload.storageKey),
    };
  } catch (error) {
    await db.evidenceUpload.update({
      where: { id: upload.id },
      data: { status: "FAILED" },
    });
    throw error;
  }
}

export async function finalizeEvidenceUpload(user: User, id: string) {
  assert(
    user.role === "STUDENT",
    403,
    "FORBIDDEN",
    "Only students can upload achievement evidence.",
  );
  z.string().uuid().parse(id);
  const upload = await db.evidenceUpload.findFirst({
    where: { id, ownerId: user.id },
  });
  assert(upload, 404, "NOT_FOUND", "Upload not found.");
  if (upload.status === "COMPLETE" && upload.evidenceId) {
    const evidence = await db.evidence.findUnique({
      where: { id: upload.evidenceId },
    });
    assert(evidence, 404, "NOT_FOUND", "Evidence not found.");
    return evidenceSummary(evidence);
  }
  assert(
    upload.expiresAt > new Date(),
    422,
    "UPLOAD_EXPIRED",
    "This upload expired. Please choose the file again.",
  );
  await requireUploadStorage();
  const claimed = await db.evidenceUpload.updateMany({
    where: {
      id,
      ownerId: user.id,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
    data: { status: "PROCESSING" },
  });
  assert(
    claimed.count === 1,
    409,
    "UPLOAD_BUSY",
    "This upload is already being checked or has failed. Please choose the file again if it does not finish.",
  );
  let permanentKey: string | undefined;
  try {
    const bytes = await stagedEvidence(upload.storageKey);
    assert(
      bytes.length === upload.sizeBytes,
      422,
      "FILE_SIZE_MISMATCH",
      "The uploaded file does not match the selected file. Please upload it again.",
    );
    // Store exactly the bytes that were validated and scanned under a NEW key.
    // A leaked/replayed staging URL can never replace approved evidence.
    const stored = await storeEvidence(
      user.id,
      bytes,
      upload.mimeType,
      upload.fileName,
    );
    permanentKey = stored.storageKey;
    const evidence = await db.$transaction(async (tx) => {
      const owner = await tx.user.findUnique({ where: { id: user.id } });
      assert(
        owner &&
          !owner.removedAt &&
          owner.status === "ACTIVE" &&
          owner.role === "STUDENT",
        403,
        "FORBIDDEN",
        "This account can no longer upload evidence.",
      );
      const e = await tx.evidence.create({
        data: { ownerId: user.id, ...stored },
      });
      await audit(tx, user, "EVIDENCE_UPLOADED", "Evidence", e.id, {
        fileName: e.fileName,
        sha256: e.sha256,
      });
      await tx.evidenceUpload.update({
        where: { id },
        data: { status: "COMPLETE", evidenceId: e.id },
      });
      return e;
    });
    permanentKey = undefined;
    return evidenceSummary(evidence);
  } catch (error) {
    await db.evidenceUpload.updateMany({
      where: { id, status: "PROCESSING" },
      data: { status: "FAILED" },
    });
    throw error;
  } finally {
    // Cleanup failures never turn a successful, committed upload into a failure.
    for (const key of [upload.storageKey, permanentKey].filter(
      (key): key is string => !!key,
    )) {
      await discardEvidence(key).catch(() =>
        console.error("PRiym temporary evidence cleanup needs retry", id),
      );
    }
  }
}

export async function cleanupExpiredUploads() {
  if (process.env.STORAGE_PROVIDER !== "supabase") return 0;
  const expired = await db.evidenceUpload.findMany({
    where: { expiresAt: { lt: new Date() } },
    take: 100,
    orderBy: { expiresAt: "asc" },
  });
  let removed = 0;
  for (const upload of expired) {
    // Capabilities have expired, so abandoned or replayed staging objects can be removed.
    try {
      await discardEvidence(upload.storageKey);
      await db.evidenceUpload.delete({ where: { id: upload.id } });
      removed++;
    } catch {
      console.error("PRiym expired evidence cleanup needs retry", upload.id);
    }
  }
  return removed;
}
