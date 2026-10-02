import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import ExcelJS from "exceljs";
export function csvCell(value: unknown) {
  const s = String(value ?? "");
  const safe = /^[\s]*[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replaceAll('"', '""')}"`;
}
export function csv(rows: unknown[][]) {
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
export async function reportBytes(
  rows: string[][],
  format: string,
  watermark: string,
) {
  if (format === "csv")
    return {
      bytes: Buffer.from(csv(rows)),
      mime: "text/csv; charset=utf-8",
      extension: "csv",
    };
  if (format === "xlsx") {
    const book = new ExcelJS.Workbook();
    book.creator = "PRiym";
    const sheet = book.addWorksheet("Achievements");
    sheet.addRows(rows);
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF176957" },
    };
    sheet.columns.forEach((c) => (c.width = 24));
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    return {
      bytes: Buffer.from(await book.xlsx.writeBuffer()),
      mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      extension: "xlsx",
    };
  }
  const pdf = await PDFDocument.create(),
    font = await pdf.embedFont(StandardFonts.Helvetica),
    bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const safe = (s: string) => s.replace(/[^\x20-\x7e]/g, "?");
  let page = pdf.addPage([842, 595]),
    y = 0,
    pageNo = 0;
  const newPage = () => {
    if (pageNo) page = pdf.addPage([842, 595]);
    pageNo++;
    page.drawText("PRiym | Verified achievement report", {
      x: 35,
      y: 550,
      size: 18,
      font: bold,
      color: rgb(0.09, 0.36, 0.28),
    });
    page.drawText(safe(watermark).slice(0, 145), {
      x: 35,
      y: 525,
      size: 8,
      font,
    });
    page.drawText(`Atria Institute of Technology | Page ${pageNo}`, {
      x: 35,
      y: 25,
      size: 8,
      font,
      color: rgb(0.45, 0.5, 0.47),
    });
    y = 497;
  };
  newPage();
  // Each record wraps over multiple lines rather than clipping wide columns.
  for (let i = 1; i < rows.length; i++) {
    const lines: string[] = [];
    for (let j = 0; j < rows[i].length; j++) {
      const text = `${rows[0][j]}: ${rows[i][j]}`;
      for (let k = 0; k < text.length; k += 120)
        lines.push(text.slice(k, k + 120));
    }
    if (y - lines.length * 12 < 50) newPage();
    for (const line of lines) {
      page.drawText(safe(line), { x: 35, y, size: 9, font });
      y -= 12;
    }
    y -= 13;
  }
  if (rows.length === 1)
    page.drawText("No achievements match these filters.", {
      x: 35,
      y,
      size: 12,
      font,
    });
  return {
    bytes: Buffer.from(await pdf.save()),
    mime: "application/pdf",
    extension: "pdf",
  };
}
