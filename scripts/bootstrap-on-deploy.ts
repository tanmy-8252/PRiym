import "../src/lib/env";
import { db } from "../src/lib/db";
import { bootstrapAdministrator } from "../src/server/bootstrap";
import {
  BootstrapSetupError,
  bootstrapFailureMessage,
} from "../src/lib/bootstrap-errors";

// Provisioning is an explicit operator action using private deployment settings.
// There is no public bootstrap API. Default deployments never create accounts.
if (process.env.BOOTSTRAP_ADMIN_ENABLED === "true") {
  try {
    if (process.env.VERCEL_ENV !== "production")
      throw new BootstrapSetupError("production");
    if (
      (process.env.AUTH_SECRET?.length || 0) < 32 ||
      (process.env.AUDIT_SECRET?.length || 0) < 32
    )
      throw new BootstrapSetupError("applicationSecrets");
    let canonicalUrl: URL;
    try {
      canonicalUrl = new URL(process.env.AUTH_URL || "");
    } catch {
      throw new BootstrapSetupError("canonicalUrl");
    }
    if (canonicalUrl.protocol !== "https:")
      throw new BootstrapSetupError("canonicalUrl");
    const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.toLowerCase();
    const existing = await db.user.findUnique({
      where: { email: email || "" },
    });
    if (existing?.role === "ADMIN") {
      console.log(
        "Initial Admin already exists; no credentials or records changed. Remove BOOTSTRAP_ADMIN_* settings.",
      );
    } else {
      await bootstrapAdministrator({
        email,
        name: process.env.BOOTSTRAP_ADMIN_NAME,
        password: process.env.BOOTSTRAP_ADMIN_PASSWORD,
        secret: process.env.BOOTSTRAP_ADMIN_MFA_SECRET,
      });
      console.log(
        "Initial Admin and CSE provisioned. Remove BOOTSTRAP_ADMIN_* settings now.",
      );
    }
  } catch (error) {
    console.error(
      `Initial Admin setup failed: ${bootstrapFailureMessage(error)}`,
    );
    process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
}
