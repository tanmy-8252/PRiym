import "../src/lib/env";
import { db } from "../src/lib/db";
import { assertLocalDemo, demoAccounts } from "../src/lib/demo";
import { decrypt } from "../src/lib/crypto";
import { generateTotp, totpStep, TOTP_PERIOD_MS } from "../src/lib/totp";
async function main() {
  assertLocalDemo();
  const json = process.argv.includes("--json");
  const roleIndex = process.argv.indexOf("--role");
  const role =
    roleIndex >= 0 ? process.argv[roleIndex + 1]?.toUpperCase() : undefined;
  if (role && !["HOD", "ADMIN"].includes(role))
    throw new Error("--role must be hod or admin.");
  const accounts = demoAccounts.filter(
    (a) => ["HOD", "ADMIN"].includes(a.role) && (!role || a.role === role),
  );
  const users = await Promise.all(
    accounts.map((a) => db.user.findUnique({ where: { email: a.email } })),
  );
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    if (
      !user ||
      user.role !== accounts[i].role ||
      user.status !== "ACTIVE" ||
      !user.emailVerified ||
      !user.mfaSecret ||
      (user.lockedUntil && user.lockedUntil > new Date())
    )
      throw new Error(
        `${accounts[i].email} is missing, inactive, locked or not provisioned. Run npm run demo:reset.`,
      );
  }
  // Do not print an already consumed code or one about to expire.
  let epoch = Date.now();
  if (
    users.some((u) => u!.lastTotpStep === totpStep(epoch)) ||
    TOTP_PERIOD_MS - (epoch % TOTP_PERIOD_MS) < 15_000
  ) {
    if (!json) console.log("Waiting for a fresh, unused 30-second code…");
    await new Promise((resolve) =>
      setTimeout(resolve, TOTP_PERIOD_MS - (epoch % TOTP_PERIOD_MS) + 150),
    );
    epoch = Date.now();
  }
  const codes = users.map((u) => {
    let secret: string;
    try {
      secret = decrypt(u!.mfaSecret!);
    } catch {
      throw new Error(
        `${u!.email}: stored secret cannot be read with AUTH_SECRET. Run npm run demo:reset.`,
      );
    }
    return {
      role: u!.role,
      email: u!.email,
      code: generateTotp(secret, epoch),
    };
  });
  const validForSeconds = Math.floor(
    (TOTP_PERIOD_MS - (epoch % TOTP_PERIOD_MS)) / 1000,
  );
  if (json) console.log(JSON.stringify({ codes, validForSeconds }));
  else {
    codes.forEach((c) => console.log(`${c.role} (${c.email}): ${c.code}`));
    console.log(
      `Valid for ${validForSeconds} seconds. Each code is single-use per account. Generate a fresh code before each login.`,
    );
  }
}
main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
