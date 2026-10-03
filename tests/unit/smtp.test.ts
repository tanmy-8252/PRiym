import { afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  sendMail: vi.fn(),
  close: vi.fn(),
  createTransport: vi.fn(),
}));
vi.mock("nodemailer", () => ({
  default: { createTransport: mocks.createTransport },
}));
import { sendSmtp } from "@/server/smtp";
const config = {
  provider: "smtp" as const,
  from: "owner@gmail.com",
  host: "smtp.gmail.com",
  port: 465,
  user: "owner@gmail.com",
  password: "private-synthetic-key",
};
const message = {
  id: "test-id",
  recipient: "student@atria.edu.in",
  subject: "Verify",
  body: "Synthetic verification message",
};
afterEach(() => vi.resetAllMocks());
describe("SMTP transport", () => {
  it("sends through TLS with no file/URL access and closes its connection", async () => {
    mocks.createTransport.mockReturnValue(mocks);
    mocks.sendMail.mockResolvedValue({
      accepted: [message.recipient],
      rejected: [],
    });
    await sendSmtp(config, message);
    expect(mocks.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        secure: true,
        requireTLS: true,
        auth: { user: config.user, pass: config.password },
        disableFileAccess: true,
        disableUrlAccess: true,
        tls: { minVersion: "TLSv1.2", servername: config.host },
      }),
    );
    expect(mocks.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: { address: message.recipient, name: "" },
        text: message.body,
        messageId: "<test-id@gmail.com>",
      }),
    );
    expect(mocks.close).toHaveBeenCalledOnce();
  });
  it("fails on SMTP rejection and never records credential-bearing error messages", async () => {
    mocks.createTransport.mockReturnValue(mocks);
    mocks.sendMail.mockRejectedValue(
      Object.assign(new Error(`Auth failed for ${config.password}`), {
        code: "EAUTH",
      }),
    );
    await expect(sendSmtp(config, message)).rejects.toThrow(
      "SMTP delivery failed (EAUTH)",
    );
    await expect(sendSmtp(config, message)).rejects.not.toThrow(
      config.password,
    );
    expect(mocks.close).toHaveBeenCalledTimes(2);
    mocks.sendMail.mockResolvedValue({
      accepted: [],
      rejected: [message.recipient],
    });
    await expect(sendSmtp(config, message)).rejects.toThrow(
      "SMTP delivery failed",
    );
  });
});
