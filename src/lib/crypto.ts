import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
function key() {
  if (!process.env.AUTH_SECRET) throw new Error("AUTH_SECRET is required");
  return createHash("sha256").update(process.env.AUTH_SECRET).digest();
}
export function encrypt(value: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const b = Buffer.concat([c.update(value, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), b].map((x) => x.toString("base64")).join(".");
}
export function decrypt(value: string) {
  const [iv, tag, b] = value.split(".").map((x) => Buffer.from(x, "base64"));
  const c = createDecipheriv("aes-256-gcm", key(), iv);
  c.setAuthTag(tag);
  return Buffer.concat([c.update(b), c.final()]).toString("utf8");
}
