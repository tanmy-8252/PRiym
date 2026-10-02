process.env.NODE_ENV = "production";
await import("./load-env.mjs");
import { cp, access } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
const root = process.cwd(),
  dist = process.env.NEXT_DIST_DIR || ".next",
  dir = path.join(root, dist, "standalone");
try {
  await access(path.join(dir, "server.js"));
} catch {
  throw new Error("Run npm run build before npm start.");
}
await cp(path.join(root, dist, "static"), path.join(dir, dist, "static"), {
  recursive: true,
});
try {
  await access(path.join(root, "public"));
  await cp(path.join(root, "public"), path.join(dir, "public"), {
    recursive: true,
  });
} catch {}
const args = process.argv.slice(2),
  portIndex = args.indexOf("--port"),
  port = portIndex >= 0 ? args[portIndex + 1] : process.env.PORT || "3000";
if (!/^\d+$/.test(port) || Number(port) < 1024 || Number(port) > 65535)
  throw new Error("Choose a valid port from 1024–65535.");
const child = spawn(process.execPath, [path.join(dir, "server.js")], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: port,
    HOSTNAME: process.env.APP_HOST || "0.0.0.0",
  },
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code || 0));
