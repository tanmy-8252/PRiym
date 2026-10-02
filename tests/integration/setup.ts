import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { readdir, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
export default async function setup() {
  if (process.env.TEST_DATABASE_URL) {
    if (!new URL(process.env.TEST_DATABASE_URL).pathname.includes("test"))
      throw new Error(
        "TEST_DATABASE_URL must point to a database with 'test' in its name.",
      );
    execFileSync(
      "node",
      ["node_modules/prisma/build/index.js", "migrate", "deploy"],
      {
        env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
        stdio: "inherit",
      },
    );
    return;
  }
  const db = await PGlite.create();
  for (const folder of (await readdir("prisma/migrations"))
    .filter((s) => s !== "migration_lock.toml")
    .sort())
    await db.exec(
      await readFile(`prisma/migrations/${folder}/migration.sql`, "utf8"),
    );
  const server = new PGLiteSocketServer({
    db,
    host: "127.0.0.1",
    port: 54330,
    maxConnections: 10,
  });
  await server.start();
  return async () => {
    await server.stop();
    await db.close();
  };
}
