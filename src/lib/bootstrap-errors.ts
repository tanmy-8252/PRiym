import { z } from "zod";

const setupMessages = {
  production: "BOOTSTRAP_ADMIN_ENABLED can only be used in Vercel Production.",
  applicationSecrets:
    "AUTH_SECRET and AUDIT_SECRET must each contain at least 32 characters. Keep the existing production secrets; do not replace them with local demo values.",
  canonicalUrl: "AUTH_URL must be a valid HTTPS production URL.",
  existingAdmin:
    "An Admin already exists. Use the authenticated administration portal; bootstrap cannot replace an existing administrator.",
} as const;

export class BootstrapSetupError extends Error {
  constructor(readonly reason: keyof typeof setupMessages) {
    super(setupMessages[reason]);
    this.name = "BootstrapSetupError";
  }
}

const fieldMessages = {
  email: "BOOTSTRAP_ADMIN_EMAIL must be a valid email address.",
  name: "BOOTSTRAP_ADMIN_NAME must contain 2–100 characters.",
  password:
    "BOOTSTRAP_ADMIN_PASSWORD must contain 8–72 characters, at most 72 UTF-8 bytes, with uppercase, lowercase, a number and a special character.",
  secret:
    "BOOTSTRAP_ADMIN_MFA_SECRET must be the full 16–64-character authenticator setup key, using uppercase A–Z and digits 2–7. Do not enter the six-digit code or the Gmail app password.",
} as const;

// Never include arbitrary error messages, validation input, Prisma metadata,
// connection strings or credentials in deployment logs.
export function bootstrapFailureMessage(error: unknown): string {
  if (error instanceof BootstrapSetupError) return setupMessages[error.reason];
  if (error instanceof z.ZodError) {
    const fields = new Set(error.issues.map((issue) => issue.path[0]));
    const messages = Object.entries(fieldMessages)
      .filter(([field]) => fields.has(field))
      .map(([, message]) => message);
    return messages.length
      ? messages.join(" ")
      : "The private BOOTSTRAP_ADMIN_* settings are incomplete or invalid.";
  }
  const code =
    error && typeof error === "object" && "code" in error
      ? error.code
      : undefined;
  switch (code) {
    case "P2002":
      return "The requested administrator email already belongs to an account. Bootstrap cannot overwrite it; an existing administrator must manage it through the portal.";
    case "P2021":
    case "P2022":
      return "The connected database schema is missing required tables or columns. Check that DATABASE_URL uses the migrated Production database.";
    case "P2024":
    case "P2028":
      return "The administrator database transaction timed out. Retry the deployment; bootstrap will not overwrite an administrator already created.";
    case "P1000":
    case "P1001":
    case "P1002":
    case "P1011":
    case "P1017":
    case "ECONNREFUSED":
    case "ETIMEDOUT":
      return "The administrator setup could not connect securely to the database. Check the Production DATABASE_URL connection and availability.";
    default:
      return "Administrator setup encountered an unexpected database or application error. No credentials have been printed; inspect the private Production configuration.";
  }
}
