import { api } from "@/server/http";
import { requireUser } from "@/server/session";
import { finalizeEvidenceUpload } from "@/server/evidence";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return api(request, async () =>
    finalizeEvidenceUpload(
      await requireUser(["STUDENT"]),
      (await context.params).id,
    ),
  );
}
