import { afterEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getBucket: vi.fn(),
  scan: vi.fn(),
  requireScanner: vi.fn(),
  archive: vi.fn(),
  download: vi.fn(),
  requireArchive: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ storage: { getBucket: mocks.getBucket } }),
}));
vi.mock("@/server/malware", () => ({
  scanEvidence: mocks.scan,
  requireScanner: mocks.requireScanner,
}));
vi.mock("@/server/cloudinary-evidence", () => ({
  uploadCloudinaryEvidence: mocks.archive,
  downloadCloudinaryEvidence: mocks.download,
  deleteCloudinaryEvidence: vi.fn(),
  isCloudinaryEvidenceKey: (key: string) => key.startsWith("cloudinary:"),
  requireCloudinaryEvidenceConfig: mocks.requireArchive,
}));

import { retrieveEvidence, storeEvidence } from "@/server/storage";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

it("scans original bytes before archiving and restores using recorded hash", async () => {
  vi.stubEnv("STORAGE_PROVIDER", "supabase");
  vi.stubEnv("EVIDENCE_ARCHIVE_PROVIDER", "cloudinary");
  vi.stubEnv("SUPABASE_URL", "https://storage.example");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-only-key");
  mocks.getBucket.mockResolvedValue({
    data: { public: false, file_size_limit: 10 * 1024 * 1024 },
    error: null,
  });
  mocks.scan.mockResolvedValue("CLEAN");
  mocks.archive.mockResolvedValue({
    storageKey: "cloudinary:assetId123:gzip",
    storedSizeBytes: 100,
  });
  const original = Buffer.from("%PDF-1.7\nStudent proof");
  const stored = await storeEvidence(
    "owner-uuid",
    original,
    "application/pdf",
    "proof.pdf",
  );
  expect(mocks.scan).toHaveBeenCalledWith(
    original,
    "application/pdf",
    "proof.pdf",
  );
  expect(mocks.archive).toHaveBeenCalledWith("owner-uuid", original);
  expect(mocks.scan.mock.invocationCallOrder[0]).toBeLessThan(
    mocks.archive.mock.invocationCallOrder[0],
  );
  expect(stored.storageKey).toBe("cloudinary:assetId123:gzip");
  mocks.download.mockResolvedValue(original);
  expect(
    await retrieveEvidence(stored.storageKey, {
      sizeBytes: stored.sizeBytes,
      sha256: stored.sha256,
    }),
  ).toEqual({ bytes: original });
  expect(mocks.download).toHaveBeenCalledWith(
    stored.storageKey,
    original.length,
    stored.sha256,
  );
});
