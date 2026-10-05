import { api } from "@/server/http";
import { requireUser } from "@/server/session";
import { prepareEvidenceUpload } from "@/server/evidence";
import { scaniiConfigurationStatus } from "@/server/scanii";
export const runtime = "nodejs";
export async function GET(request: Request) {
  return api(request, async () => {
    await requireUser(["STUDENT", "FACULTY", "HOD", "ADMIN"]);
    return scaniiConfigurationStatus();
  });
}
export async function POST(request: Request) {
  return api(request, async () =>
    prepareEvidenceUpload(await requireUser(["STUDENT"]), await request.json()),
  );
}
