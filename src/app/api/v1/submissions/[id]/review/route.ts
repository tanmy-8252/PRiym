import { api } from "@/server/http";
import { requireUser } from "@/server/session";
import { reviewSubmission } from "@/server/submissions";
export async function POST(r: Request, c: { params: Promise<{ id: string }> }) {
  return api(r, async () =>
    reviewSubmission(
      await requireUser(["FACULTY", "HOD"]),
      (await c.params).id,
      await r.json(),
    ),
  );
}
