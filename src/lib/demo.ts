export const demoAccounts = [
  { label: "Student", email: "student@atria.edu", role: "STUDENT" },
  { label: "Faculty", email: "faculty@atria.edu", role: "FACULTY" },
  { label: "HOD", email: "hod@atria.edu", role: "HOD" },
  { label: "Admin", email: "admin@atria.edu", role: "ADMIN" },
] as const;
export function isLoopback(hostname: string) {
  return ["localhost", "127.0.0.1", "[::1]", "::1"].includes(hostname);
}
export function localDemoEnabled(env: NodeJS.ProcessEnv = process.env) {
  try {
    return (
      env.NODE_ENV !== "production" &&
      env.SEED_DEMO === "true" &&
      isLoopback(new URL(env.DATABASE_URL!).hostname)
    );
  } catch {
    return false;
  }
}
export function assertLocalDemo(env: NodeJS.ProcessEnv = process.env) {
  if (!localDemoEnabled(env))
    throw new Error(
      "Demo commands require SEED_DEMO=true, a nonproduction environment and a loopback DATABASE_URL.",
    );
  if (
    !env.DEMO_PASSWORD ||
    env.DEMO_PASSWORD.length < 8 ||
    Buffer.byteLength(env.DEMO_PASSWORD) > 72
  )
    throw new Error("DEMO_PASSWORD must be 8–72 bytes.");
  if (!/^[A-Z2-7]{16,}$/.test(env.DEMO_TOTP_SECRET || ""))
    throw new Error(
      "DEMO_TOTP_SECRET must be a generated base32 secret. Run node scripts/create-env.mjs.",
    );
}
