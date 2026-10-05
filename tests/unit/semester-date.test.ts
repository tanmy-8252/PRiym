import { describe, expect, it } from "vitest";
import { semesterDateSchema } from "@/lib/validation";

describe("semester dates", () => {
  it("accepts an academic period with full calendar years", () => {
    expect(semesterDateSchema.parse("2026-08-31")).toBe("2026-08-31");
    expect(semesterDateSchema.parse("2027-07-31")).toBe("2027-07-31");
  });

  it.each(["0026-08-31", "0027-07-31", "26-08-31", "2026-02-30"])(
    "rejects malformed or truncated date %s",
    (value) => {
      expect(semesterDateSchema.safeParse(value).success).toBe(false);
    },
  );
});
