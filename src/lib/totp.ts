import { authenticator } from "otplib";
import { HashAlgorithms } from "@otplib/core";
// One explicit configuration for enrollment, login, and the demo CLI.
// Strict current interval only; no extra production clock window.
export const TOTP_PERIOD_MS = 30_000;
export const totp = authenticator.clone({
  algorithm: HashAlgorithms.SHA1,
  digits: 6,
  step: 30,
  window: 0,
});
export function totpStep(epoch = Date.now()) {
  return BigInt(Math.floor(epoch / TOTP_PERIOD_MS));
}
export function generateTotp(secret: string, epoch = Date.now()) {
  return totp.clone({ epoch }).generate(secret);
}
export function verifyTotp(code: string, secret: string, epoch = Date.now()) {
  return /^\d{6}$/.test(code) && totp.clone({ epoch }).check(code, secret);
}
