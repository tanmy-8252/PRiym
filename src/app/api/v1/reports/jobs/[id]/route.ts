import { requireUser } from "@/server/session";
import { errorResponse } from "@/server/http";
import { downloadReport } from "@/server/report-jobs";
export async function GET(
  r: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const u = await requireUser();
    const { bytes, format } = await downloadReport(u, (await params).id);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type":
          format === "pdf"
            ? "application/pdf"
            : format === "xlsx"
              ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              : "text/csv",
        "Content-Disposition": `attachment; filename="priym-report.${format}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
