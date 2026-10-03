import "../src/lib/env";
import { db } from "../src/lib/db";
import { mailConfiguration } from "../src/lib/mail-config";
import { smtpTransport } from "../src/server/smtp";
import { registrationAvailable } from "../src/server/registration-setup";

try {
  await db.$queryRaw`SELECT 1`;
  console.log("Hosted database: connected.");
  const departments = await db.department.findMany({ select: { code: true } });
  const admins = await db.user.count({
    where: {
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: true,
      mfaSecret: { not: null },
    },
  });
  console.log(
    `Departments: ${departments.map((d) => d.code).join(", ") || "none yet"}.`,
  );
  console.log(`Active administrators with MFA: ${admins}.`);
  const mail = mailConfiguration();
  if (!mail || mail.provider === "file")
    throw new Error("Production email settings are incomplete.");
  if (mail.provider === "smtp") {
    const transport = smtpTransport(mail);
    try {
      await transport.verify();
      console.log(
        "SMTP: TLS connection and account authentication passed. No email sent.",
      );
    } catch {
      throw new Error(
        "SMTP verification failed. Check the Gmail app password and private settings.",
      );
    } finally {
      transport.close();
    }
  } else console.log("Resend: configured; delivery has not been tested.");
  const ready = await registrationAvailable();
  console.log(
    `Registration prerequisites: ${ready ? "ready" : "incomplete; create the initial Admin and CSE"}.`,
  );
  if (!ready) process.exitCode = 1;
} catch (error) {
  // Never print driver errors or connection strings containing credentials.
  console.error(
    error instanceof Error && !("code" in error)
      ? error.message
      : "Production check failed. Check the private database settings and deployed migrations.",
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
