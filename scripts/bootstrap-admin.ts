import "../src/lib/env";
import { db } from "../src/lib/db";
import { passwordSchema } from "../src/lib/validation";
import { encrypt } from "../src/lib/crypto";
import { hash } from "bcryptjs";
import { audit } from "../src/server/audit";
import { z } from "zod";
const d = z
  .object({
    email: z.email(),
    name: z.string().min(2).max(100),
    password: passwordSchema,
    secret: z.string().regex(/^[A-Z2-7]{16,64}$/),
  })
  .parse({
    email: process.env.BOOTSTRAP_ADMIN_EMAIL,
    name: process.env.BOOTSTRAP_ADMIN_NAME,
    password: process.env.BOOTSTRAP_ADMIN_PASSWORD,
    secret: process.env.BOOTSTRAP_ADMIN_MFA_SECRET,
  });
try {
  await db.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(913826)`;
      if (await tx.user.count({ where: { role: "ADMIN" } }))
        throw new Error(
          "An Admin already exists. Use the authenticated administration portal.",
        );
      const department = await tx.department.upsert({
        where: { code: "CSE" },
        create: { code: "CSE", name: "Computer Science & Engineering" },
        update: {},
      });
      const user = await tx.user.create({
        data: {
          email: d.email.toLowerCase(),
          name: d.name,
          passwordHash: await hash(d.password, 12),
          role: "ADMIN",
          status: "ACTIVE",
          emailVerified: true,
          departmentId: department.id,
          mfaSecret: encrypt(d.secret),
        },
      });
      await audit(tx, null, "ADMIN_BOOTSTRAPPED", "User", user.id);
    },
    { timeout: 15000 },
  );
  console.log(
    "Initial administrator provisioned. Remove BOOTSTRAP_ADMIN_* variables from the private environment.",
  );
} finally {
  await db.$disconnect();
}
