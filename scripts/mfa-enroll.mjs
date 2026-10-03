import { authenticator } from "otplib";
import { HashAlgorithms } from "@otplib/core";
import { createInterface } from "node:readline/promises";

if (!process.stdin.isTTY || !process.stdout.isTTY) {
  console.error(
    "Run this command yourself in an interactive terminal. Keep the enrollment secret private.",
  );
  process.exit(1);
}
const totp = authenticator.clone({
  algorithm: HashAlgorithms.SHA1,
  digits: 6,
  step: 30,
  window: 0,
});
const secret = totp.generateSecret();
console.log(
  `Add PRiym to your authenticator using manual entry:\nSecret: ${secret}\nType: Time based\nAlgorithm: SHA-1\nDigits: 6\nPeriod: 30 seconds\nKeep the secret private. Do not send it in chat or commit it to GitHub.\n`,
);
const rl = createInterface({ input: process.stdin, output: process.stdout });
try {
  const code = await rl.question(
    "Current six-digit code from that authenticator entry: ",
  );
  if (!/^\d{6}$/.test(code) || !totp.check(code, secret)) {
    console.error(
      "Code did not match. Rerun enrollment and replace the unused entry.",
    );
    process.exitCode = 1;
  } else
    console.log(
      "Enrollment confirmed. Copy the secret privately into Vercel's BOOTSTRAP_ADMIN_MFA_SECRET, scoped to Production only.",
    );
} finally {
  rl.close();
}
