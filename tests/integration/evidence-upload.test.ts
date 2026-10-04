import { randomUUID, createHash } from "node:crypto";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  it,
  vi,
} from "vitest";
import { db } from "@/lib/db";
import type { User } from "@/generated/prisma/client";
import { AppError } from "@/lib/errors";
const mocks = vi.hoisted(() => ({
  ready: vi.fn(),
  signed: vi.fn(),
  staged: vi.fn(),
  stored: vi.fn(),
  discard: vi.fn(),
}));
vi.mock("@/server/storage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/storage")>()),
  requireUploadStorage: mocks.ready,
  signedEvidenceUpload: mocks.signed,
  stagedEvidence: mocks.staged,
  storeEvidence: mocks.stored,
  discardEvidence: mocks.discard,
}));
import {
  prepareEvidenceUpload,
  finalizeEvidenceUpload,
  cleanupExpiredUploads,
} from "@/server/evidence";
import { validateFile } from "@/server/storage";
const pdf = Buffer.from("%PDF-1.7\nSynthetic isolated test evidence");
let student: User, other: User, faculty: User, departmentId: string;
const stored = () => ({
  storageKey: `${student.id}/${randomUUID()}`,
  sha256: createHash("sha256").update(pdf).digest("hex"),
  scanStatus: "CLEAN",
  sizeBytes: pdf.length,
  mimeType: "application/pdf",
  fileName: "proof.pdf",
});
const metadata = {
  fileName: "proof.pdf",
  mimeType: "application/pdf",
  sizeBytes: pdf.length,
};
async function pending() {
  const upload = await prepareEvidenceUpload(student, metadata);
  if (upload.transport !== "direct") throw new Error("Expected direct upload");
  return upload;
}
beforeAll(async () => {
  departmentId = (
    await db.department.create({
      data: { code: `UPLOAD-${randomUUID()}`, name: "Upload tests" },
    })
  ).id;
  const make = (role: User["role"]) =>
    db.user.create({
      data: {
        name: "Upload test",
        email: `${randomUUID()}@atria.edu`,
        departmentId,
        passwordHash: "isolated-test",
        role,
        status: "ACTIVE",
        emailVerified: true,
      },
    });
  student = await make("STUDENT");
  other = await make("STUDENT");
  faculty = await make("FACULTY");
});
beforeEach(() => {
  vi.stubEnv("STORAGE_PROVIDER", "supabase");
  mocks.ready.mockResolvedValue(undefined);
  mocks.signed.mockResolvedValue("https://storage.example/signed");
  mocks.staged.mockResolvedValue(pdf);
  mocks.discard.mockResolvedValue(undefined);
  mocks.stored.mockImplementation(async (_owner, bytes, mime, name) => {
    validateFile(bytes, mime, name);
    return stored();
  });
});
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});
afterAll(async () => {
  const ids = [student.id, other.id, faculty.id];
  await db.evidenceUpload.deleteMany({ where: { ownerId: { in: ids } } });
  await db.evidence.deleteMany({ where: { ownerId: { in: ids } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
  await db.department.delete({ where: { id: departmentId } });
  await db.$disconnect();
});
it("only returns verified evidence after finalization, with a permanent key and an audit record", async () => {
  const upload = await pending();
  expect(await db.evidence.count({ where: { ownerId: student.id } })).toBe(0);
  const evidence = await finalizeEvidenceUpload(student, upload.id);
  const record = await db.evidence.findUniqueOrThrow({
    where: { id: evidence.id },
  });
  expect(record.scanStatus).toBe("CLEAN");
  expect(record.storageKey).not.toContain("quarantine/");
  expect(record.sha256).toBe(createHash("sha256").update(pdf).digest("hex"));
  expect(
    await db.auditLog.count({
      where: { action: "EVIDENCE_UPLOADED", entityId: evidence.id },
    }),
  ).toBe(1);
  expect(
    (await db.evidenceUpload.findUniqueOrThrow({ where: { id: upload.id } }))
      .status,
  ).toBe("COMPLETE");
  expect(await finalizeEvidenceUpload(student, upload.id)).toEqual(evidence);
  expect(mocks.stored).toHaveBeenCalledTimes(1);
  expect(mocks.discard.mock.calls[0][0]).toContain("quarantine/");
});
it("rejects other owners, faculty, expired capabilities and oversized reservations", async () => {
  const upload = await pending();
  await expect(finalizeEvidenceUpload(other, upload.id)).rejects.toMatchObject({
    code: "NOT_FOUND",
  });
  await expect(prepareEvidenceUpload(faculty, metadata)).rejects.toMatchObject({
    code: "FORBIDDEN",
  });
  await expect(
    prepareEvidenceUpload(student, {
      ...metadata,
      sizeBytes: 10 * 1024 * 1024 + 1,
    }),
  ).rejects.toMatchObject({ code: "INVALID_FILE" });
  await db.evidenceUpload.update({
    where: { id: upload.id },
    data: { expiresAt: new Date(0) },
  });
  await expect(
    finalizeEvidenceUpload(student, upload.id),
  ).rejects.toMatchObject({ code: "UPLOAD_EXPIRED" });
  expect(mocks.staged).not.toHaveBeenCalled();
});
it("does not attach forged content, mismatched sizes or a failed security scan", async () => {
  for (const failure of ["signature", "size", "scan"]) {
    const upload = await pending();
    const before = await db.evidence.count({ where: { ownerId: student.id } });
    if (failure === "signature")
      mocks.staged.mockResolvedValueOnce(Buffer.alloc(pdf.length));
    if (failure === "size")
      mocks.staged.mockResolvedValueOnce(Buffer.from("short"));
    if (failure === "scan")
      mocks.stored.mockRejectedValueOnce(
        new AppError(422, "SCAN_FAILED", "Threat detected"),
      );
    await expect(
      finalizeEvidenceUpload(student, upload.id),
    ).rejects.toBeDefined();
    expect(await db.evidence.count({ where: { ownerId: student.id } })).toBe(
      before,
    );
    expect(
      (await db.evidenceUpload.findUniqueOrThrow({ where: { id: upload.id } }))
        .status,
    ).toBe("FAILED");
  }
});
it("serializes finalization so a capability cannot create two evidence records", async () => {
  const upload = await pending();
  let release!: () => void, started!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const entered = new Promise<void>((resolve) => {
    started = resolve;
  });
  mocks.staged.mockImplementationOnce(async () => {
    started();
    await gate;
    return pdf;
  });
  const first = finalizeEvidenceUpload(student, upload.id);
  await entered;
  await expect(
    finalizeEvidenceUpload(student, upload.id),
  ).rejects.toMatchObject({ code: "UPLOAD_BUSY" });
  release();
  await first;
  expect(mocks.stored).toHaveBeenCalledTimes(1);
});
it("rejects an account deactivated during scanning and removes the unsaved permanent object", async () => {
  const upload = await pending();
  const permanent = stored();
  mocks.stored.mockImplementationOnce(async () => {
    await db.user.update({
      where: { id: student.id },
      data: { status: "INACTIVE" },
    });
    return permanent;
  });
  try {
    await expect(
      finalizeEvidenceUpload(student, upload.id),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.discard).toHaveBeenCalledWith(permanent.storageKey);
  } finally {
    await db.user.update({
      where: { id: student.id },
      data: { status: "ACTIVE" },
    });
  }
});
it("cleans expired staging objects without deleting finalized evidence", async () => {
  const upload = await pending();
  const evidence = await finalizeEvidenceUpload(student, upload.id);
  await db.evidenceUpload.update({
    where: { id: upload.id },
    data: { expiresAt: new Date(0) },
  });
  await cleanupExpiredUploads();
  expect(
    await db.evidenceUpload.findUnique({ where: { id: upload.id } }),
  ).toBeNull();
  expect(
    await db.evidence.findUnique({ where: { id: evidence.id } }),
  ).not.toBeNull();
});
