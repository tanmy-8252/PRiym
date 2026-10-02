import { api } from "@/server/http";
import { requireUser } from "@/server/session";
import { getSubmission, saveSubmission } from "@/server/submissions";
type Context = { params: Promise<{ id: string }> };
export async function GET(r: Request, c: Context) {
  return api(r, async () => {
    const s = await getSubmission(await requireUser(), (await c.params).id);
    return {
      ...s,
      student: { name: s.student.name, usn: s.student.usn },
      reviewer: s.reviewer ? { name: s.reviewer.name } : null,
      evidence: s.evidence.map((e) => ({
        id: e.id,
        fileName: e.fileName,
        mimeType: e.mimeType,
        sizeBytes: e.sizeBytes,
        sha256: e.sha256,
        scanStatus: e.scanStatus,
      })),
    };
  });
}
export async function PATCH(r: Request, c: Context) {
  return api(r, async () =>
    saveSubmission(
      await requireUser(["STUDENT"]),
      await r.json(),
      (await c.params).id,
    ),
  );
}
