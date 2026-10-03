import { afterEach, expect, it, vi } from "vitest";
import { authorizedCron } from "@/server/cron-auth";
afterEach(() => vi.unstubAllEnvs());
it("requires the exact private cron bearer without throwing on Unicode headers", () => {
  vi.stubEnv("CRON_SECRET", "synthetic-secret");
  const request = (value: string) =>
    new Request("https://example.com/api/mail/maintenance", {
      headers: { authorization: value },
    });
  expect(authorizedCron(request("Bearer synthetic-secret"))).toBe(true);
  expect(authorizedCron(request("Bearer wrong-secret"))).toBe(false);
  expect(authorizedCron(request("é".repeat(23)))).toBe(false);
  vi.stubEnv("CRON_SECRET", "");
  expect(authorizedCron(request("Bearer "))).toBe(false);
});
