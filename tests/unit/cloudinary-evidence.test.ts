import { createHash, randomBytes } from "node:crypto";
import { gzipSync } from "node:zlib";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  decodeEvidence,
  deleteCloudinaryEvidence,
  downloadCloudinaryEvidence,
  encodeEvidence,
  uploadCloudinaryEvidence,
} from "@/server/cloudinary-evidence";

const hash = (bytes: Buffer) =>
  createHash("sha256").update(bytes).digest("hex");

beforeEach(() => {
  vi.stubEnv("CLOUDINARY_CLOUD_NAME", "priym-test");
  vi.stubEnv("CLOUDINARY_API_KEY", "test-key");
  vi.stubEnv("CLOUDINARY_API_SECRET", "test-secret");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it("restores a compressed evidence file byte-for-byte and rejects corrupted archives", () => {
  const original = Buffer.from("%PDF-1.7\n" + "certificate text\n".repeat(3000));
  const encoded = encodeEvidence(original);
  expect(encoded.encoding).toBe("gzip");
  expect(encoded.data.length).toBeLessThan(original.length);
  expect(decodeEvidence(encoded.data, "gzip", original.length, hash(original))).toEqual(
    original,
  );
  expect(() =>
    decodeEvidence(encoded.data, "gzip", original.length, hash(Buffer.from("other"))),
  ).toThrow("Evidence failed its integrity check.");
  expect(() =>
    decodeEvidence(Buffer.from("not-gzip"), "gzip", original.length, hash(original)),
  ).toThrow("Evidence failed its integrity check.");
  expect(() =>
    decodeEvidence(
      gzipSync(Buffer.alloc(10 * 1024 * 1024 + 1)),
      "gzip",
      original.length,
      hash(original),
    ),
  ).toThrow("Evidence failed its integrity check.");
});

it("keeps already dense files raw instead of storing a larger archive", () => {
  const dense = randomBytes(2048);
  const encoded = encodeEvidence(dense);
  expect(encoded.encoding).toBe("raw");
  expect(decodeEvidence(encoded.data, "raw", dense.length, hash(dense))).toEqual(
    dense,
  );
});

it("uploads only an authenticated raw object and checks Cloudinary's receipt", async () => {
  const original = Buffer.from("%PDF-1.7\n" + "evidence ".repeat(2000));
  const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
    expect(url).toBe("https://api.cloudinary.com/v1_1/priym-test/raw/upload");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      Authorization: `Basic ${Buffer.from("test-key:test-secret").toString("base64")}`,
    });
    const form = init.body as FormData;
    expect(form.get("type")).toBe("authenticated");
    expect(form.get("overwrite")).toBe("false");
    const publicId = String(form.get("public_id"));
    expect(publicId).toMatch(/^priym-evidence\/student-id\/[a-f0-9-]+\.gz$/);
    const uploaded = Buffer.from(await (form.get("file") as Blob).arrayBuffer());
    expect(decodeEvidence(uploaded, "gzip", original.length, hash(original))).toEqual(
      original,
    );
    return Response.json({
      asset_id: "assetId123",
      public_id: publicId,
      resource_type: "raw",
      type: "authenticated",
      bytes: uploaded.length,
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  const result = await uploadCloudinaryEvidence("student-id", original);
  expect(result.storageKey).toBe("cloudinary:assetId123:gzip");
  expect(result.storedSizeBytes).toBeLessThan(original.length);
});

it("downloads by immutable asset ID, verifies bytes, and can remove the object", async () => {
  const original = Buffer.from("%PDF-1.7\n" + "evidence ".repeat(2000));
  const archived = encodeEvidence(original).data;
  const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
    if (url.endsWith("/asset/destroy")) {
      expect(url).toBe("https://api.cloudinary.com/v1_1/priym-test/asset/destroy");
      expect((init.body as URLSearchParams).get("asset_id")).toBe("assetId123");
      return Response.json({ result: "ok" });
    }
    expect(url).toBe(
      "https://api.cloudinary.com/v1_1/priym-test/asset/download?asset_id=assetId123",
    );
    expect(init.headers).toEqual({
      Authorization: `Basic ${Buffer.from("test-key:test-secret").toString("base64")}`,
    });
    return new Response(new Uint8Array(archived));
  });
  vi.stubGlobal("fetch", fetchMock);
  expect(
    await downloadCloudinaryEvidence(
      "cloudinary:assetId123:gzip",
      original.length,
      hash(original),
    ),
  ).toEqual(original);
  await deleteCloudinaryEvidence("cloudinary:assetId123:gzip");
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it("rejects oversized or mismatched downloads without returning evidence", async () => {
  const original = Buffer.from("%PDF-1.7\nevidence");
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(new Uint8Array(Buffer.from("other")))),
  );
  await expect(
    downloadCloudinaryEvidence(
      "cloudinary:assetId123:raw",
      original.length,
      hash(original),
    ),
  ).rejects.toMatchObject({ code: "STORAGE_CORRUPT" });
  await expect(
    downloadCloudinaryEvidence(
      "cloudinary:../../bad:raw",
      original.length,
      hash(original),
    ),
  ).rejects.toMatchObject({ code: "INVALID_KEY" });
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(new Uint8Array(Buffer.from("other")), {
          headers: { "content-length": String(10 * 1024 * 1024 + 1) },
        }),
    ),
  );
  await expect(
    downloadCloudinaryEvidence(
      "cloudinary:assetId123:raw",
      original.length,
      hash(original),
    ),
  ).rejects.toMatchObject({ code: "STORAGE_CORRUPT" });
});

it("rejects an upload receipt that is not private raw evidence", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        asset_id: "assetId123",
        public_id: "wrong-public-id",
        resource_type: "image",
        type: "upload",
        bytes: 10,
      }),
    ),
  );
  await expect(
    uploadCloudinaryEvidence("student-id", Buffer.from("%PDF-1.7\nproof")),
  ).rejects.toMatchObject({ code: "STORAGE_FAILED" });
});
