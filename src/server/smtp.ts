import nodemailer from "nodemailer";
import type { MailConfiguration } from "@/lib/mail-config";

export function smtpTransport(
  config: Extract<MailConfiguration, { provider: "smtp" }>,
) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    requireTLS: true,
    tls: { minVersion: "TLSv1.2", servername: config.host },
    auth: { user: config.user, pass: config.password },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
    dnsTimeout: 5000,
    disableFileAccess: true,
    disableUrlAccess: true,
    logger: false,
    debug: false,
  });
}

export async function sendSmtp(
  config: Extract<MailConfiguration, { provider: "smtp" }>,
  message: { id: string; recipient: string; subject: string; body: string },
) {
  const transport = smtpTransport(config);
  try {
    const result = await transport.sendMail({
      from: { name: "PRiym", address: config.from },
      to: { address: message.recipient, name: "" },
      subject: message.subject,
      text: message.body,
      messageId: `<${message.id}@${config.from.split("@")[1]}>`,
    });
    if (result.rejected.length || !result.accepted.length)
      throw new Error("SMTP recipient was rejected");
  } catch (error) {
    const code = (error as { code?: string }).code;
    const safeCode = code && /^[A-Z_]+$/.test(code) ? ` (${code})` : "";
    throw new Error(
      `SMTP delivery failed${safeCode}. Check the private email settings.`,
    );
  } finally {
    transport.close();
  }
}
