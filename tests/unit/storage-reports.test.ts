import { it, expect } from "vitest";
import { validateFile } from "@/server/storage";
import { csvCell, reportBytes } from "@/server/reports";
it("rejects forged and oversized files", () => {
  expect(() =>
    validateFile(Buffer.from("not a pdf"), "application/pdf", "a.pdf"),
  ).toThrow();
  expect(() =>
    validateFile(Buffer.alloc(10 * 1024 * 1024 + 1), "image/png", "a.png"),
  ).toThrow();
  expect(() =>
    validateFile(Buffer.from("%PDF-1.7"), "application/pdf", "a.exe"),
  ).toThrow();
  expect(() =>
    validateFile(Buffer.from("%PDF-1.7"), "application/pdf", "a.pdf"),
  ).not.toThrow();
});
it("prevents spreadsheet formula injection and quotes CSV", () => {
  expect(csvCell("=SUM(A1)")).toBe('"\'=SUM(A1)"');
  expect(csvCell('a"b')).toBe('"a""b"');
});
it("exports genuine PDF and XLSX documents", async () => {
  const rows = [
    ["Student", "Achievement"],
    ["Aanya", "Certification"],
  ];
  const pdf = await reportBytes(rows, "pdf", "Aanya · STUDENT");
  expect(pdf.bytes.subarray(0, 5).toString()).toBe("%PDF-");
  const excel = await reportBytes(rows, "xlsx", "Aanya");
  expect(excel.bytes.subarray(0, 2).toString()).toBe("PK");
});
