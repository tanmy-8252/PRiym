import { api } from "@/server/http";
import { requireUser } from "@/server/session";
import { reviewSubmission } from "@/server/submissions";
import { z } from "zod";
export async function POST(r: Request) {
  return api(r, async () => {
    const u = await requireUser(["FACULTY"]),
      d = z
        .object({
          items: z
            .array(
              z.object({
                id: z.string().uuid(),
                version: z.number().int().nonnegative(),
              }),
            )
            .min(1)
            .max(50),
          comment: z.string().min(10).max(2000),
        })
        .parse(await r.json());
    const results = [];
    for (const item of d.items) {
      try {
        await reviewSubmission(u, item.id, {
          action: "CLARIFY",
          version: item.version,
          comment: d.comment,
        });
        results.push({ id: item.id, ok: true });
      } catch (e) {
        results.push({ id: item.id, ok: false, error: (e as Error).message });
      }
    }
    return { results };
  });
}
