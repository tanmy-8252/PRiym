import "./load-env.mjs";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import net from "node:net";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
const dir = path.resolve(".data");
const port = Number(process.env.EMBEDDED_DB_PORT || 54329);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error("Invalid EMBEDDED_DB_PORT.");
fs.mkdirSync(dir, { recursive: true });
const pidFile = path.join(dir, "embedded-db.pid");
const mode = process.argv[2] || "start";
if (mode === "stop") {
  if (fs.existsSync(pidFile)) {
    process.kill(Number(fs.readFileSync(pidFile, "utf8")), "SIGTERM");
    fs.unlinkSync(pidFile);
  }
  process.exit(0);
}
if (mode === "serve") {
  const db = await PGlite.create(path.join(dir, "pglite"));
  const server = new PGLiteSocketServer({
    db,
    host: "127.0.0.1",
    port,
    maxConnections: 20,
  });
  await server.start();
  console.log(
    `Embedded PostgreSQL listening on 127.0.0.1:${port} (development only)`,
  );
  const stop = async () => {
    await server.stop();
    await db.close();
    process.exit(0);
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
} else {
  if (fs.existsSync(pidFile)) {
    try {
      process.kill(Number(fs.readFileSync(pidFile, "utf8")), 0);
      console.log("Embedded database already running.");
      process.exit(0);
    } catch {
      fs.unlinkSync(pidFile);
    }
  }
  const log = fs.openSync(path.join(dir, "embedded-db.log"), "a");
  const child = spawn(
    process.execPath,
    [new URL(import.meta.url).pathname, "serve"],
    { detached: true, stdio: ["ignore", log, log] },
  );
  child.unref();
  fs.writeFileSync(pidFile, String(child.pid));
  let ready = false;
  for (let i = 0; i < 100 && !ready; i++) {
    ready = await new Promise((resolve) => {
      const s = net.connect(port, "127.0.0.1");
      s.on("connect", () => {
        s.destroy();
        resolve(true);
      });
      s.on("error", () => resolve(false));
    });
    if (!ready) await new Promise((r) => setTimeout(r, 100));
  }
  if (!ready)
    throw new Error("Database did not start. See .data/embedded-db.log");
  console.log(`Embedded PostgreSQL ready on 127.0.0.1:${port}`);
}
