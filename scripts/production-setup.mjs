import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { parse } from "dotenv";
import { authenticator } from "otplib";
import { HashAlgorithms } from "@otplib/core";

const file = resolve(".env.operator");
const mode = process.argv[2] || "check";
if (!["check", "bootstrap"].includes(mode))
  throw new Error(
    "Use npm run production:check or npm run production:bootstrap.",
  );
if (!existsSync(file)) {
  console.error(
    "Create the private .env.operator from docs/production.env.example and fill in the Production values from Vercel.",
  );
  process.exit(1);
}
const privateEnv = parse(readFileSync(file));
for (const key of ["DATABASE_URL", "AUTH_URL", "AUTH_SECRET", "AUDIT_SECRET"]) {
  if (!privateEnv[key] || /REPLACE|YOUR_|GENERATE_/.test(privateEnv[key])) {
    console.error(
      `Set ${key} privately in .env.operator. Do not paste secrets into chat.`,
    );
    process.exit(1);
  }
}
try {
  const database = new URL(privateEnv.DATABASE_URL),
    app = new URL(privateEnv.AUTH_URL);
  if (
    !["postgres:", "postgresql:"].includes(database.protocol) ||
    ["localhost", "127.0.0.1", "[::1]"].includes(database.hostname) ||
    database.searchParams.get("sslmode") !== "require" ||
    app.protocol !== "https:" ||
    app.username ||
    app.password ||
    privateEnv.AUTH_SECRET.length < 32 ||
    privateEnv.AUDIT_SECRET.length < 32 ||
    privateEnv.SEED_DEMO !== "false" ||
    privateEnv.NEXT_PUBLIC_DEMO_MODE !== "false"
  )
    throw new Error();
} catch {
  console.error(
    "Use the hosted PostgreSQL URL with sslmode=require, the HTTPS primary domain, matching production secrets of at least 32 characters, and both demo flags=false.",
  );
  process.exit(1);
}
const env = {
  ...process.env,
  ...privateEnv,
  NODE_ENV: "production",
  PRIYM_ENV_ISOLATED: "true",
};
// These can only come from the interactive enrollment below.
delete env.BOOTSTRAP_ADMIN_PASSWORD;
delete env.BOOTSTRAP_ADMIN_MFA_SECRET;

function run(script, extra = {}) {
  const result = spawnSync(process.execPath, ["--import", "tsx", script], {
    env: { ...env, ...extra },
    stdio: "inherit",
  });
  if (result.error) throw new Error("Could not start setup. Run npm ci first.");
  return result.status ?? 1;
}

async function hiddenQuestion(prompt) {
  const input = process.stdin,
    output = process.stdout;
  output.write(prompt);
  input.setRawMode(true);
  input.resume();
  let value = "";
  try {
    return await new Promise((resolveValue, reject) => {
      function onData(chunk) {
        for (const char of chunk.toString()) {
          if (char === "\u0003") {
            input.off("data", onData);
            reject(new Error("Setup cancelled."));
            return;
          }
          if (char === "\r" || char === "\n") {
            input.off("data", onData);
            resolveValue(value);
            return;
          }
          if (char === "\u007f" || char === "\b") value = value.slice(0, -1);
          else if (char >= " ") value += char;
        }
      }
      input.on("data", onData);
    });
  } finally {
    input.setRawMode(false);
    input.pause();
    output.write("\n");
  }
}

try {
  if (mode === "bootstrap") {
    if (!process.stdin.isTTY || !process.stdout.isTTY)
      throw new Error(
        "Run this yourself in an interactive terminal. It privately asks for the Admin password and authenticator enrollment.",
      );
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const email =
      privateEnv.BOOTSTRAP_ADMIN_EMAIL ||
      (await rl.question("Initial Admin email: "));
    const name =
      privateEnv.BOOTSTRAP_ADMIN_NAME ||
      (await rl.question("Admin full name: "));
    const confirmation = await rl.question(
      `Create the initial Admin ${email} and CSE in the HOSTED database? Type CREATE: `,
    );
    rl.close();
    if (confirmation !== "CREATE")
      throw new Error("Setup cancelled; no records changed.");
    const password = await hiddenQuestion(
      "New unique PRiym Admin password (hidden): ",
    );
    if (
      Buffer.byteLength(password) > 72 ||
      !/^(?=.{8,72}$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).*$/.test(
        password,
      )
    )
      throw new Error(
        "Use 8–72 characters with uppercase, lowercase, a number and a special character. No records changed.",
      );
    if (password !== (await hiddenQuestion("Repeat password (hidden): ")))
      throw new Error("Passwords did not match. No records changed.");
    const totp = authenticator.clone({
      algorithm: HashAlgorithms.SHA1,
      digits: 6,
      step: 30,
      window: 0,
    });
    const secret = totp.generateSecret();
    console.log(
      `\nAdd an account in your authenticator:\nIssuer: PRiym\nAccount: ${email}\nSecret: ${secret}\nType: Time based, SHA-1, 6 digits, 30 seconds.\nKeep this secret private; it will not be saved to the environment file.\n`,
    );
    const code = await hiddenQuestion(
      "Current six-digit code from your authenticator (hidden): ",
    );
    if (!/^\d{6}$/.test(code) || !totp.check(code, secret))
      throw new Error(
        "Authenticator code did not match. No records changed; rerun setup and replace the unused authenticator entry.",
      );
    const status = run("scripts/bootstrap-admin.ts", {
      BOOTSTRAP_ADMIN_EMAIL: email,
      BOOTSTRAP_ADMIN_NAME: name,
      BOOTSTRAP_ADMIN_PASSWORD: password,
      BOOTSTRAP_ADMIN_MFA_SECRET: secret,
    });
    if (status) process.exit(status);
  }
  process.exitCode = run("scripts/production-check.ts");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
