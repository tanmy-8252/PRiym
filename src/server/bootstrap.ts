import { db } from "@/lib/db";
import { passwordSchema } from "@/lib/validation";
import { encrypt } from "@/lib/crypto";
import { hash } from "bcryptjs";
import { audit } from "./audit";
import { z } from "zod";

export async function bootstrapAdministrator(raw: unknown, database = db) {
  const d = z
    .object({
      email: z.email().toLowerCase(),
      name: z.string().min(2).max(100),
      password: passwordSchema,
      secret: z.string().regex(/^[A-Z2-7]{16,64}$/),
    })
    .parse(raw);
  return database.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(913826)`;
      if (await tx.user.count({ where: { role: "ADMIN" } }))
        throw new Error(
          "An Admin already exists. Use the authenticated administration portal.",
        );
      const department = await tx.department.upsert({
        where: { code: "CSE" },
        create: { code: "CSE", name: "Computer Science & Engineering (CSE)" },
        update: {},
      });
      const user = await tx.user.create({
        data: {
          email: d.email,
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
      return { id: user.id, email: user.email, department: department.code };
    },
    { timeout: 15000 },
  );
}
