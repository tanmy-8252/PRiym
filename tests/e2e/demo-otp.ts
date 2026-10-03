import { execFileSync } from "node:child_process";
import { expect } from "@playwright/test";

export function demoOtp(role: string) {
  const expectedRole = role.toUpperCase();
  // Use the exact seeded account and wait if its current interval was already
  // consumed by another test. Production retains strict one-time TOTP checks.
  const result = JSON.parse(
    execFileSync(
      process.execPath,
      [
        "--import",
        "tsx",
        "scripts/demo-otp.ts",
        "--role",
        expectedRole,
        "--json",
      ],
      { encoding: "utf8", timeout: 40000 },
    ),
  );
  expect(result.codes[0].role).toBe(expectedRole);
  expect(result.codes[0].email).toBe(`${role.toLowerCase()}@atria.edu`);
  expect(result.validForSeconds).toBeGreaterThanOrEqual(14);
  return result.codes[0].code as string;
}
