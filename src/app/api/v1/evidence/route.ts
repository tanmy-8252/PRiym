import { api } from "@/server/http";
import { requireUser } from "@/server/session";
import { MAX_FILE_BYTES, storeEvidence } from "@/server/storage";
import { assert } from "@/lib/errors";
import { db } from "@/lib/db";
import { audit } from "@/server/audit";
export async function POST(r: Request) {
  return api(r, async () => {
    const u = await requireUser(["STUDENT"]);
    const recent = await db.evidence.count({
      where: {
        ownerId: u.id,
        createdAt: { gte: new Date(Date.now() - 3600_000) },
      },
    });
    assert(
      recent < 50,
      429,
      "UPLOAD_LIMIT",
      "Please wait before uploading more documents.",
    );
    const name = new URL(r.url).searchParams.get("name") || "evidence";
    assert(r.body, 422, "EMPTY_FILE", "Choose a document.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    const reader = r.body.getReader();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        assert(
          size <= MAX_FILE_BYTES,
          422,
          "FILE_SIZE",
          "Each file must be at most 10 MB.",
        );
        chunks.push(value);
      }
    } finally {
      await reader.cancel();
    }
    const stored = await storeEvidence(
      u.id,
      Buffer.concat(chunks),
      r.headers.get("content-type") || "",
      name,
    );
    const evidence = await db.$transaction(async (tx) => {
      const e = await tx.evidence.create({
        data: { ownerId: u.id, ...stored },
      });
      await audit(tx, u, "EVIDENCE_UPLOADED", "Evidence", e.id, {
        fileName: e.fileName,
        sha256: e.sha256,
      });
      return e;
    });
    return {
      id: evidence.id,
      fileName: evidence.fileName,
      sizeBytes: evidence.sizeBytes,
    };
  });
}
