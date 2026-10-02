import { api } from "@/server/http";
import { requireUser } from "@/server/session";
import { saveSubmission, submissionScope } from "@/server/submissions";
import { db } from "@/lib/db";
export async function GET(request: Request) {
  return api(request, async () => {
    const u = await requireUser();
    return db.submission.findMany({
      where: submissionScope(u),
      include: {
        category: true,
        reviewer: { select: { name: true } },
        student: { select: { name: true, usn: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  });
}
export async function POST(request: Request) {
  return api(request, async () =>
    saveSubmission(await requireUser(["STUDENT"]), await request.json()),
  );
}
