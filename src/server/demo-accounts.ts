import { db } from "@/lib/db";
import { hash } from "bcryptjs";
import { encrypt } from "@/lib/crypto";
import { assertLocalDemo } from "@/lib/demo";
import { audit } from "./audit";
// Explicit local fixtures only. Never delete institution accounts or achievement data.
export async function resetDemoAccounts() {
  assertLocalDemo();
  const passwordHash = await hash(process.env.DEMO_PASSWORD!, 12);
  return db.$transaction(
    async (tx) => {
      const dept = await tx.department.upsert({
        where: { code: "CSE" },
        update: {},
        create: { code: "CSE", name: "Computer Science & Engineering" },
      });
      const other = await tx.department.upsert({
        where: { code: "ECE" },
        update: {},
        create: { code: "ECE", name: "Electronics & Communication" },
      });
      const users = [
        {
          email: "faculty@atria.edu",
          name: "Dr Meera Rao",
          role: "FACULTY" as const,
          departmentId: dept.id,
        },
        {
          email: "faculty2@atria.edu",
          name: "Prof Rahul Shah",
          role: "FACULTY" as const,
          departmentId: dept.id,
        },
        {
          email: "hod@atria.edu",
          name: "Dr Arun Kumar",
          role: "HOD" as const,
          departmentId: dept.id,
        },
        {
          email: "admin@atria.edu",
          name: "Kavya Sharma",
          role: "ADMIN" as const,
          departmentId: dept.id,
        },
        {
          email: "student@atria.edu",
          name: "Aanya Patel",
          role: "STUDENT" as const,
          usn: "1AT24CS001",
          batchYear: 2024,
          departmentId: dept.id,
        },
        {
          email: "student2@atria.edu",
          name: "Rohan Nair",
          role: "STUDENT" as const,
          usn: "1AT23CS002",
          batchYear: 2023,
          departmentId: dept.id,
        },
        {
          email: "student3@atria.edu",
          name: "Ishita Reddy",
          role: "STUDENT" as const,
          usn: "1AT24CS003",
          batchYear: 2024,
          departmentId: dept.id,
        },
        {
          email: "student4@atria.edu",
          name: "Aditya Singh",
          role: "STUDENT" as const,
          usn: "1AT22CS004",
          batchYear: 2022,
          departmentId: dept.id,
        },
        {
          email: "other@atria.edu",
          name: "Neha Menon",
          role: "STUDENT" as const,
          usn: "1AT24EC001",
          batchYear: 2024,
          departmentId: other.id,
        },
      ];
      for (const fixture of users) {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${fixture.email}))`;
        const data = {
          ...fixture,
          passwordHash,
          status: "ACTIVE" as const,
          emailVerified: true,
          failedAttempts: 0,
          lockedUntil: null,
          lastTotpStep: null,
          pendingMfaSecret: null,
          mfaSecret: ["HOD", "ADMIN"].includes(fixture.role)
            ? encrypt(process.env.DEMO_TOTP_SECRET!)
            : null,
        };
        const user = await tx.user.upsert({
          where: { email: fixture.email },
          create: data,
          update: data,
        });
        await tx.authSession.updateMany({
          where: { userId: user.id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        await tx.mfaRecoveryCode.deleteMany({ where: { userId: user.id } });
        await tx.accountToken.deleteMany({ where: { userId: user.id } });
        await tx.passwordHistory.deleteMany({ where: { userId: user.id } });
        await audit(tx, user, "DEMO_ACCOUNT_RESET", "User", user.id);
      }
      return { dept, other };
    },
    { timeout: 30000 },
  );
}
