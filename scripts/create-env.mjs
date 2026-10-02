import fs from "node:fs";
import crypto from "node:crypto";
if (process.env.NODE_ENV === "production")
  throw new Error("Local demo environment creation is disabled in production.");
const existed = fs.existsSync(".env");
let source = fs.readFileSync(existed ? ".env" : ".env.example", "utf8");
const base32 = () =>
  Array.from(
    crypto.randomBytes(32),
    (b) => "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"[b % 32],
  ).join("");
// Repair copied placeholders without ever rotating a valid encryption/signing key.
for (const name of [
  "AUTH_SECRET",
  "AUDIT_SECRET",
  "CRON_SECRET",
  "DEMO_TOTP_SECRET",
]) {
  const pattern = new RegExp(`^${name}=(.*)$`, "m");
  const match = source.match(pattern);
  const value = match?.[1].trim().replace(/^["']|["']$/g, "");
  if (value && !value.startsWith("replace-with-")) continue;
  const line = `${name}="${name === "DEMO_TOTP_SECRET" ? base32() : crypto.randomBytes(32).toString("hex")}"`;
  source = match
    ? source.replace(pattern, line)
    : `${source.trimEnd()}\n${line}\n`;
}
fs.writeFileSync(".env", source, { mode: 0o600 });
fs.chmodSync(".env", 0o600);
