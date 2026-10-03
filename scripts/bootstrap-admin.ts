import "../src/lib/env";
import { db } from "../src/lib/db";
import { bootstrapAdministrator } from "../src/server/bootstrap";

try {
  await bootstrapAdministrator({
    email: process.env.BOOTSTRAP_ADMIN_EMAIL,
    name: process.env.BOOTSTRAP_ADMIN_NAME,
    password: process.env.BOOTSTRAP_ADMIN_PASSWORD,
    secret: process.env.BOOTSTRAP_ADMIN_MFA_SECRET,
  });
  console.log(
    "Initial administrator and CSE provisioned. Remove BOOTSTRAP_ADMIN_* variables from the private environment.",
  );
} finally {
  await db.$disconnect();
}
