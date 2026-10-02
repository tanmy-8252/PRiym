import { api } from "@/server/http";
import { requireUser } from "@/server/session";
import { db } from "@/lib/db";
import { submissionScope } from "@/server/submissions";
export async function GET(r: Request) {
  return api(r, async () => {
    const u = await requireUser(["FACULTY", "HOD", "ADMIN"]),
      q = (new URL(r.url).searchParams.get("q") || "").trim().slice(0, 100);
    if (q.length < 2) return { students: [], faculty: [], submissions: [] };
    const scope = u.role === "ADMIN" ? {} : { departmentId: u.departmentId };
    const [students, faculty, submissions] = await Promise.all([
      db.user.findMany({
        where: {
          ...scope,
          role: "STUDENT",
          ...(u.role === "FACULTY" ? { mentorId: u.id } : {}),
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { usn: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, usn: true },
        take: 10,
      }),
      db.user.findMany({
        where: {
          ...scope,
          role: "FACULTY",
          name: { contains: q, mode: "insensitive" },
        },
        select: { id: true, name: true },
        take: 10,
      }),
      db.submission.findMany({
        where: {
          AND: [
            submissionScope(u),
            {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { id: { startsWith: q } },
                { category: { name: { contains: q, mode: "insensitive" } } },
              ],
            },
          ],
        },
        select: { id: true, title: true, status: true },
        take: 10,
      }),
    ]);
    return { students, faculty, submissions };
  });
}
