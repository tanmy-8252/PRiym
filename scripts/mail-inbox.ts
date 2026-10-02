import "../src/lib/env";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
if (process.env.NODE_ENV === "production")
  throw new Error("Development inbox is disabled in production.");
const dir = path.resolve(process.env.MAIL_DIR || ".data/mail"),
  recipient = process.argv[2];
for (const name of await readdir(dir).catch(() => [])) {
  if (!name.endsWith(".json")) continue;
  const m = JSON.parse(await readFile(path.join(dir, name), "utf8"));
  if (!recipient || m.to === recipient)
    console.log(`To: ${m.to}\nSubject: ${m.subject}\n${m.text}\n`);
}
