import { api } from "@/server/http";
import { requireUser } from "@/server/session";
import { prepareEvidenceUpload } from "@/server/evidence";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return api(request, async () =>
    prepareEvidenceUpload(await requireUser(["STUDENT"]), await request.json()),
  );
}
