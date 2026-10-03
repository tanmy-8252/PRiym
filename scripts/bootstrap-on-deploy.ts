import "../src/lib/env";
import { db } from "../src/lib/db";
import { bootstrapAdministrator } from "../src/server/bootstrap";

// Provisioning is an explicit operator action using private deployment settings.
// There is no public bootstrap API. Default deployments never create accounts.
if (process.env.BOOTSTRAP_ADMIN_ENABLED === "true") {
  try {
    if (process.env.VERCEL_ENV !== "production")
      throw new Error(
        "Bootstrap is restricted to Vercel Production deployments.",
      );
    if (
      (process.env.AUTH_SECRET?.length || 0) < 32 ||
      (process.env.AUDIT_SECRET?.length || 0) < 32 ||
      new URL(process.env.AUTH_URL || "").protocol !== "https:"
    )
      throw new Error(
        "Production application secrets and canonical URL are required.",
      );
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
  } catch {
    console.error(
      "Initial Admin setup failed. Check the private bootstrap settings; an existing Admin can only manage accounts through the authenticated portal.",
    );
    process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
}
