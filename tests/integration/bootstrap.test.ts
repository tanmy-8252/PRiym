import { beforeAll, afterAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { readdir, readFile } from "node:fs/promises";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { compare } from "bcryptjs";
import { bootstrapAdministrator } from "@/server/bootstrap";
import { decrypt } from "@/lib/crypto";
import { totp, verifyTotp } from "@/lib/totp";

let engine: PGlite, server: PGLiteSocketServer, database: PrismaClient;
beforeAll(async () => {
  engine = await PGlite.create();
  for (const folder of (await readdir("prisma/migrations"))
    .filter((f) => f !== "migration_lock.toml")
    .sort())
    await engine.exec(
      await readFile(`prisma/migrations/${folder}/migration.sql`, "utf8"),
    );
  server = new PGLiteSocketServer({
    db: engine,
    host: "127.0.0.1",
    port: 0,
    maxConnections: 10,
  });
  await server.start();
  database = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: `postgresql://postgres:postgres@${server.getServerConn()}/postgres`,
      max: 2,
    }),
  });
});
afterAll(async () => {
  await database?.$disconnect();
  await server?.stop();
  await engine?.close();
});
it("atomically provisions one initial Admin with bcrypt, encrypted usable MFA, CSE and an audit record", async () => {
  const secret = totp.generateSecret(),
    password = "UniqueAdmin1!";
  const results = await Promise.allSettled([
    bootstrapAdministrator(
      { email: "owner@example.com", name: "Initial Owner", password, secret },
      database,
    ),
    bootstrapAdministrator(
      { email: "another@example.com", name: "Second Owner", password, secret },
      database,
    ),
  ]);
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect(await database.user.count({ where: { role: "ADMIN" } })).toBe(1);
  const admin = await database.user.findFirstOrThrow({
    where: { role: "ADMIN" },
  });
  expect(admin.status).toBe("ACTIVE");
  expect(admin.emailVerified).toBe(true);
  expect(admin.passwordHash).not.toBe(password);
  expect(await compare(password, admin.passwordHash)).toBe(true);
  expect(admin.mfaSecret).not.toBe(secret);
  expect(verifyTotp(totp.generate(secret), decrypt(admin.mfaSecret!))).toBe(
    true,
  );
  expect(
    await database.department.findUnique({ where: { code: "CSE" } }),
  ).not.toBeNull();
  expect(
    await database.auditLog.count({
      where: { action: "ADMIN_BOOTSTRAPPED", entityId: admin.id },
    }),
  ).toBe(1);
  await expect(
    bootstrapAdministrator(
      {
        email: "replacement@example.com",
        name: "Replacement",
        password,
        secret,
      },
      database,
    ),
  ).rejects.toThrow("An Admin already exists");
  expect(
    (await database.user.findUniqueOrThrow({ where: { id: admin.id } }))
      .passwordHash,
  ).toBe(admin.passwordHash);
});
