import { requireUser } from "@/server/session";
import { errorResponse } from "@/server/http";
import { db } from "@/lib/db";
import { retrieveEvidence } from "@/server/storage";
import { assert } from "@/lib/errors";
import { canReadSubmission } from "@/lib/rules";
import { audit } from "@/server/audit";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(r: Request, c: { params: Promise<{ id: string }> }) {
  try {
    const u = await requireUser();
    const e = await db.evidence.findUnique({
      where: { id: (await c.params).id },
      include: { submission: { include: { student: true } } },
    });
    assert(
      e &&
        (e.ownerId === u.id ||
          (e.submission && canReadSubmission(u, e.submission))),
      404,
      "NOT_FOUND",
      "Evidence not found.",
    );
    assert(
      process.env.NODE_ENV !== "production" || e.scanStatus === "CLEAN",
      422,
      "EVIDENCE_NOT_VERIFIED",
      "This evidence has not passed its security scan.",
    );
    // BR-014: administrators need an explicitly documented exception.
    if (u.role === "ADMIN") {
      const reason = new URL(r.url).searchParams.get("reason") || "";
      assert(
        reason.length >= 20,
        403,
        "EXCEPTION_REQUIRED",
        "Administrator access requires a documented exception reason of at least 20 characters.",
      );
      await audit(db, u, "ADMIN_EVIDENCE_EXCEPTION", "Evidence", e.id, {
        reason,
      });
    }
    await audit(db, u, "EVIDENCE_VIEWED", "Evidence", e.id);
    const data = await retrieveEvidence(e.storageKey, {
      sizeBytes: e.sizeBytes,
      sha256: e.sha256,
    });
    if (data.url) return Response.redirect(data.url);
    const bytes = data.bytes!;
    let offset = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (offset >= bytes.length) return controller.close();
        const end = Math.min(offset + 64 * 1024, bytes.length);
        controller.enqueue(new Uint8Array(bytes.subarray(offset, end)));
        offset = end;
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": e.mimeType,
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(e.fileName)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
