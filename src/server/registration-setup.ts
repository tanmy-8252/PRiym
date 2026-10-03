import { db } from "@/lib/db";
import { mailConfiguration } from "@/lib/mail-config";

export async function registrationAvailable() {
  if (!(await db.department.count())) return false;
  if (process.env.NODE_ENV !== "production") return true;
  const mail = mailConfiguration();
  if (!mail || mail.provider === "file") return false;
  try {
    if (new URL(process.env.AUTH_URL || "").protocol !== "https:") return false;
  } catch {
    return false;
  }
  return !!(await db.user.findFirst({
    where: {
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: true,
      mfaSecret: { not: null },
    },
    select: { id: true },
  }));
}
