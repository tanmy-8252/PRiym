import { describe, expect, it } from "vitest";
import { mailConfiguration } from "@/lib/mail-config";

const gmail = {
  NODE_ENV: "production",
  EMAIL_PROVIDER: "smtp",
  EMAIL_FROM: "owner@gmail.com",
  SMTP_USER: "owner@gmail.com",
  SMTP_PASSWORD: "synthetic-app-password",
  SMTP_HOST: "smtp.gmail.com",
  SMTP_PORT: "465",
};
describe("production mail configuration", () => {
  it("supports Gmail with an explicit authenticated sender", () => {
    expect(mailConfiguration(gmail)).toMatchObject({
      provider: "smtp",
      port: 465,
    });
    expect(mailConfiguration({ ...gmail, SMTP_PORT: "587" })).toMatchObject({
      provider: "smtp",
      port: 587,
    });
  });
  it("rejects missing secrets, insecure ports, malformed addresses and Gmail sender mismatches", () => {
    for (const overrides of [
      { SMTP_PASSWORD: "" },
      { SMTP_HOST: "" },
      { SMTP_PORT: "25" },
      { EMAIL_FROM: "other@gmail.com" },
      { EMAIL_FROM: "owner@gmail.com\r\nBcc: attacker@example.com" },
    ])
      expect(mailConfiguration({ ...gmail, ...overrides })).toBeNull();
  });
  it("never permits the development file provider in production", () => {
    expect(mailConfiguration({ NODE_ENV: "production" })).toBeNull();
    expect(mailConfiguration({ NODE_ENV: "development" })).toEqual({
      provider: "file",
    });
  });
  it("keeps the existing Resend provider available", () => {
    expect(
      mailConfiguration({
        NODE_ENV: "production",
        EMAIL_PROVIDER: "resend",
        EMAIL_FROM: "priym@example.com",
        RESEND_API_KEY: "synthetic-test-key",
      }),
    ).toMatchObject({ provider: "resend", from: "priym@example.com" });
  });
});
