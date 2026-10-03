import { expect, it } from "vitest";
import { z } from "zod";
import {
  BootstrapSetupError,
  bootstrapFailureMessage,
} from "@/lib/bootstrap-errors";

it("identifies invalid private fields without logging their values or validation messages", () => {
  const privateValue = "PRIVATE-DO-NOT-LOG";
  const error = new z.ZodError([
    { code: "custom", path: ["password"], message: privateValue },
    { code: "custom", path: ["password"], message: privateValue },
    { code: "custom", path: ["secret"], message: privateValue },
  ]);
  const message = bootstrapFailureMessage(error);
  expect(message).toContain("BOOTSTRAP_ADMIN_PASSWORD");
  expect(message).toContain("BOOTSTRAP_ADMIN_MFA_SECRET");
  expect(message).toContain("Do not enter the six-digit code");
  expect(message.match(/BOOTSTRAP_ADMIN_PASSWORD/g)).toHaveLength(1);
  expect(message).not.toContain(privateValue);
});

it("sanitizes database errors, including private connection strings and metadata", () => {
  const privateValue =
    "postgresql://private-user:private-password@private-host/db";
  const message = bootstrapFailureMessage({
    code: "P2002",
    message: privateValue,
    meta: { target: privateValue },
  });
  expect(message).toContain("email already belongs to an account");
  expect(message).not.toContain(privateValue);
  expect(bootstrapFailureMessage(new Error(privateValue))).not.toContain(
    privateValue,
  );
});

it("distinguishes operator errors and retryable database failures without lowering security", () => {
  expect(
    bootstrapFailureMessage(new BootstrapSetupError("existingAdmin")),
  ).toContain("cannot replace an existing administrator");
  expect(
    bootstrapFailureMessage(new BootstrapSetupError("canonicalUrl")),
  ).toContain("AUTH_URL");
  expect(bootstrapFailureMessage({ code: "P2028" })).toContain("timed out");
  expect(bootstrapFailureMessage({ code: "ECONNREFUSED" })).toContain(
    "DATABASE_URL",
  );
  expect(
    bootstrapFailureMessage(
      new z.ZodError([
        { code: "custom", path: ["unexpected"], message: "private" },
      ]),
    ),
  ).toBe("The private BOOTSTRAP_ADMIN_* settings are incomplete or invalid.");
});
