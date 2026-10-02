import { describe, it, expect } from "vitest";
import { parseCsv } from "@/lib/csv-import";
describe("CSV account import", () => {
  it("handles BOM, CRLF, quoted commas, escaped quotes and multiline fields", () => {
    expect(
      parseCsv(
        '\uFEFFname,email\r\n"Doe, Jane",jane@atria.edu\r\n"A ""quoted""\nname",a@atria.edu',
      ),
    ).toEqual([
      { name: "Doe, Jane", email: "jane@atria.edu" },
      { name: 'A "quoted"\nname', email: "a@atria.edu" },
    ]);
  });
  it("rejects broken quotes, duplicated headers and mismatched columns", () => {
    expect(() => parseCsv("name,name\nx,y")).toThrow();
    expect(() => parseCsv('name,email\n"broken,a')).toThrow();
    expect(() => parseCsv("name,email\nonly")).toThrow();
  });
});
