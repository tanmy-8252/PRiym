import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ getBucket: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ storage: { getBucket: mocks.getBucket } }),
}));
import { requireUploadStorage } from "@/server/storage";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
function setup() {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("VERCEL", "1");
  vi.stubEnv("MALWARE_SCANNER", "cloudmersive");
  vi.stubEnv("CLOUDMERSIVE_API_KEY", "test-only-key");
  vi.stubEnv("STORAGE_PROVIDER", "supabase");
  vi.stubEnv("SUPABASE_URL", "https://storage.example");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-only-key");
}
it("rejects Vercel's ephemeral local storage", async () => {
  setup();
  vi.stubEnv("STORAGE_PROVIDER", "local");
  await expect(requireUploadStorage()).rejects.toMatchObject({
    code: "STORAGE_CONFIG",
  });
});
it.each([
  { public: true, file_size_limit: 10485760 },
  { public: false },
  { public: false, file_size_limit: 52428800 },
])("rejects public or unbounded staging storage", async (bucket) => {
  setup();
  mocks.getBucket.mockResolvedValue({ data: bucket, error: null });
  await expect(requireUploadStorage()).rejects.toMatchObject({
    code: "STORAGE_CONFIG",
  });
});
it("accepts a private bucket with a storage-enforced 10 MB limit", async () => {
  setup();
  mocks.getBucket.mockResolvedValue({
    data: { public: false, file_size_limit: 10485760 },
    error: null,
  });
  await expect(requireUploadStorage()).resolves.toBeUndefined();
});
