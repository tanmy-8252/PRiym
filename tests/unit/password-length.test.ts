import { expect, it } from "vitest";
import { passwordSchema } from "@/lib/validation";
it("rejects UTF-8 passwords that bcrypt would silently truncate", () => {
  expect(passwordSchema.safeParse(`Strong1!${"é".repeat(33)}`).success).toBe(
    false,
  );
  expect(passwordSchema.safeParse(`Strong1!${"é".repeat(20)}`).success).toBe(
    true,
  );
  expect(passwordSchema.safeParse(`Strong1!${"a".repeat(64)}`).success).toBe(
    true,
  );
});
