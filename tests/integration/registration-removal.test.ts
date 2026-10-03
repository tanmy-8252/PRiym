import { beforeAll, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import {
  createUser,
  removeRegistrationRequest,
  updateUser,
} from "@/server/admin";
import { consumeAccountToken, issueToken } from "@/server/account";
import { audit } from "@/server/audit";
import { signAudit } from "@/lib/audit-signature";
import type { User } from "@/generated/prisma/client";

let admin: User, departmentId: string, passwordHash: string;
const suffix = randomUUID().slice(0, 8);
async function account(overrides: Partial<User> = {}) {
  return db.user.create({
    data: {
      name: "Synthetic Pending Student",
      email: `remove-${randomUUID()}@atria.edu.in`,
      departmentId,
      passwordHash,
      role: "STUDENT",
      status: "PENDING",
      usn: `REMOVE-${randomUUID()}`,
      ...overrides,
    },
  });
}
beforeAll(async () => {
  departmentId = (
    await db.department.create({
      data: { code: `R${suffix}`, name: "Removal test department" },
    })
  ).id;
  passwordHash = await hash("SyntheticPassword1!", 4);
  admin = await account({
    role: "ADMIN",
    usn: null,
    status: "ACTIVE",
    emailVerified: true,
  });
});
afterAll(() => db.$disconnect());

it("removes an unused request, revokes links, cancels unsent mail and retains signed audit history", async () => {
  const pending = await account({ usn: "1AT26CS921" });
  const verify = await db.$transaction(async (tx) => {
    const m = await issueToken(tx, pending, "VERIFY");
    await issueToken(tx, pending, "RESET");
    await audit(tx, admin, "USER_CREATED", "User", pending.id);
    return m;
  });
  await db.passwordHistory.create({
    data: { userId: pending.id, hash: passwordHash },
  });
  await db.mfaRecoveryCode.create({
    data: { userId: pending.id, digest: randomUUID() },
  });
  await db.notification.create({
    data: { userId: pending.id, title: "Synthetic notice", body: "Test only" },
  });
  const sent = await db.mailOutbox.create({
    data: {
      recipient: pending.email,
      subject: "Sent test message",
      body: "Test only",
      status: "SENT",
      sentAt: new Date(),
    },
  });
  const token = verify.body.match(/token=([a-f0-9]{64})/)![1];
  expect(
    await removeRegistrationRequest(admin, pending.id, {
      email: pending.email,
    }),
  ).toEqual({ ok: true });
  expect(await db.user.findUnique({ where: { id: pending.id } })).toBeNull();
  expect(await db.accountToken.count({ where: { userId: pending.id } })).toBe(
    0,
  );
  expect(
    await db.passwordHistory.count({ where: { userId: pending.id } }),
  ).toBe(0);
  expect(
    await db.mfaRecoveryCode.count({ where: { userId: pending.id } }),
  ).toBe(0);
  expect(await db.notification.count({ where: { userId: pending.id } })).toBe(
    0,
  );
  expect(
    (
      await db.mailOutbox.findMany({
        where: { recipient: pending.email, id: { not: sent.id } },
      })
    ).every((m) => m.status === "CANCELLED"),
  ).toBe(true);
  expect(
    (await db.mailOutbox.findUniqueOrThrow({ where: { id: sent.id } })).status,
  ).toBe("SENT");
  await expect(
    consumeAccountToken({ token, purpose: "VERIFY" }),
  ).rejects.toMatchObject({ code: "INVALID_TOKEN" });
  const logs = await db.auditLog.findMany({ where: { entityId: pending.id } });
  expect(logs.map((l) => l.action)).toEqual(
    expect.arrayContaining(["USER_CREATED", "REGISTRATION_REMOVED"]),
  );
  for (const log of logs) {
    const { signature, createdAt, ...payload } = log;
    expect(
      signAudit(
        { ...payload, createdAt: createdAt.toISOString() },
        process.env.AUDIT_SECRET!,
      ),
    ).toBe(signature);
  }
  const corrected = await createUser(admin, {
    name: "Corrected Student",
    email: pending.email,
    usn: pending.usn,
    departmentId,
    role: "STUDENT",
    password: "SyntheticCorrected1!",
  });
  expect(corrected.id).not.toBe(pending.id);
});

it("can remove a verified but never activated Faculty request", async () => {
  const pending = await account({
    role: "FACULTY",
    usn: null,
    emailVerified: true,
  });
  await removeRegistrationRequest(admin, pending.id, { email: pending.email });
  expect(await db.user.findUnique({ where: { id: pending.id } })).toBeNull();
});

it("enforces Admin permission and confirmation of the exact account", async () => {
  const pending = await account();
  for (const role of ["STUDENT", "FACULTY", "HOD"] as const) {
    await expect(
      removeRegistrationRequest({ ...admin, role }, pending.id, {
        email: pending.email,
      }),
    ).rejects.toMatchObject({ status: 403 });
  }
  await expect(
    removeRegistrationRequest(admin, pending.id, {
      email: "different@atria.edu.in",
    }),
  ).rejects.toMatchObject({ code: "ACCOUNT_CHANGED" });
  await expect(
    removeRegistrationRequest(admin, admin.id, { email: admin.email }),
  ).rejects.toMatchObject({ code: "SELF_EDIT" });
  await expect(
    removeRegistrationRequest(admin, randomUUID(), { email: pending.email }),
  ).rejects.toMatchObject({ status: 404 });
  expect(
    await db.user.findUnique({ where: { id: pending.id } }),
  ).not.toBeNull();
});

it("cannot remove active, inactive or privileged accounts", async () => {
  for (const overrides of [
    { status: "ACTIVE" },
    { status: "INACTIVE" },
    { role: "HOD" },
    { role: "ADMIN" },
  ] as Partial<User>[]) {
    const target = await account(overrides);
    await expect(
      removeRegistrationRequest(admin, target.id, { email: target.email }),
    ).rejects.toMatchObject({ code: "NOT_PENDING_REGISTRATION" });
    expect(
      await db.user.findUnique({ where: { id: target.id } }),
    ).not.toBeNull();
  }
});

it("retains previously activated accounts even if returned to pending", async () => {
  const pending = await account({ emailVerified: true });
  await updateUser(admin, pending.id, { status: "ACTIVE" });
  await updateUser(admin, pending.id, { status: "PENDING" });
  await expect(
    removeRegistrationRequest(admin, pending.id, { email: pending.email }),
  ).rejects.toMatchObject({ code: "ACCOUNT_HAS_ACTIVITY" });
  expect(
    await db.mailOutbox.count({
      where: { recipient: pending.email, status: "PENDING" },
    }),
  ).toBe(1);
});

it("protects linked institutional records and existing login history", async () => {
  const owner = await account();
  await db.evidence.create({
    data: {
      ownerId: owner.id,
      fileName: "test.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1,
      storageKey: randomUUID(),
      sha256: "a".repeat(64),
      scanStatus: "CLEAN",
    },
  });
  await expect(
    removeRegistrationRequest(admin, owner.id, { email: owner.email }),
  ).rejects.toMatchObject({ code: "ACCOUNT_HAS_ACTIVITY" });
  const formerUser = await account();
  await db.authSession.create({
    data: {
      userId: formerUser.id,
      expiresAt: new Date(),
      revokedAt: new Date(),
    },
  });
  await expect(
    removeRegistrationRequest(admin, formerUser.id, {
      email: formerUser.email,
    }),
  ).rejects.toMatchObject({ code: "ACCOUNT_HAS_ACTIVITY" });
  const assigned = await account({ role: "FACULTY", usn: null });
  const dept = await db.department.create({
    data: {
      code: `A${suffix}`,
      name: "Assigned department",
      defaultVerifierId: assigned.id,
    },
  });
  await expect(
    removeRegistrationRequest(admin, assigned.id, { email: assigned.email }),
  ).rejects.toMatchObject({ code: "ACCOUNT_HAS_ACTIVITY" });
  await db.department.update({
    where: { id: dept.id },
    data: { defaultVerifierId: null },
  });
});

it("concurrent approval and removal cannot delete an activated account", async () => {
  const pending = await account({ emailVerified: true });
  await db.$transaction((tx) => issueToken(tx, pending, "VERIFY"));
  const results = await Promise.allSettled([
    removeRegistrationRequest(admin, pending.id, { email: pending.email }),
    updateUser(admin, pending.id, { status: "ACTIVE" }),
  ]);
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  const surviving = await db.user.findUnique({ where: { id: pending.id } });
  if (surviving) {
    expect(surviving.status).toBe("ACTIVE");
    expect(await db.accountToken.count({ where: { userId: pending.id } })).toBe(
      1,
    );
    expect(
      await db.auditLog.count({
        where: { entityId: pending.id, action: "REGISTRATION_REMOVED" },
      }),
    ).toBe(0);
  } else {
    expect(
      await db.auditLog.count({
        where: { entityId: pending.id, action: "REGISTRATION_REMOVED" },
      }),
    ).toBe(1);
  }
});
