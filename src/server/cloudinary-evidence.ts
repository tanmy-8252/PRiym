import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { gunzipSync, gzipSync } from "node:zlib";
import { assert } from "@/lib/errors";
import { MAX_FILE_BYTES } from "@/lib/evidence-files";

const PREFIX = "cloudinary:";
const MAX_STORED_BYTES = MAX_FILE_BYTES;
const MIN_SAVINGS_BYTES = 1024;
const MIN_SAVINGS_RATIO = 0.05;

type Encoding = "gzip" | "raw";

function config() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  assert(
    cloudName && /^[a-z0-9_-]+$/i.test(cloudName) && apiKey && apiSecret,
    503,
    "STORAGE_CONFIG",
    "Cloudinary evidence storage is not configured.",
  );
  return {
    base: `https://api.cloudinary.com/v1_1/${cloudName}`,
    authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`,
  };
}

export function requireCloudinaryEvidenceConfig() {
  config();
}

function parseKey(key: string) {
  const match = /^cloudinary:([a-zA-Z0-9_-]+):(gzip|raw)$/.exec(key);
  assert(match, 400, "INVALID_KEY", "Invalid Cloudinary evidence key.");
  return { assetId: match[1], encoding: match[2] as Encoding };
}

export function isCloudinaryEvidenceKey(key: string) {
  return key.startsWith(PREFIX);
}

export function encodeEvidence(bytes: Buffer): {
  data: Buffer;
  encoding: Encoding;
} {
  assert(
    bytes.length > 0 && bytes.length <= MAX_FILE_BYTES,
    422,
    "FILE_SIZE",
    "Each file must be between 1 byte and 10 MB.",
  );
  const compressed = gzipSync(bytes, { level: 6 });
  if (
    bytes.length - compressed.length >= MIN_SAVINGS_BYTES &&
    compressed.length <= bytes.length * (1 - MIN_SAVINGS_RATIO)
  ) {
    return { data: compressed, encoding: "gzip" };
  }
  return { data: bytes, encoding: "raw" };
}

export function decodeEvidence(
  data: Buffer,
  encoding: Encoding,
  expectedSize: number,
  expectedSha256: string,
) {
  assert(
    Number.isInteger(expectedSize) &&
      expectedSize > 0 &&
      expectedSize <= MAX_FILE_BYTES &&
      /^[a-f0-9]{64}$/i.test(expectedSha256) &&
      data.length > 0 &&
      data.length <= MAX_STORED_BYTES,
    503,
    "STORAGE_CORRUPT",
    "Evidence failed its integrity check.",
  );
  let original: Buffer;
  try {
    original =
      encoding === "gzip"
        ? gunzipSync(data, { maxOutputLength: MAX_FILE_BYTES })
        : data;
  } catch {
    assert(false, 503, "STORAGE_CORRUPT", "Evidence failed its integrity check.");
  }
  const actualHash = createHash("sha256").update(original).digest();
  const expectedHash = Buffer.from(expectedSha256, "hex");
  assert(
    original.length === expectedSize &&
      timingSafeEqual(actualHash, expectedHash),
    503,
    "STORAGE_CORRUPT",
    "Evidence failed its integrity check.",
  );
  return original;
}

async function readLimited(response: Response) {
  const declared = Number(response.headers.get("content-length"));
  assert(
    !Number.isFinite(declared) || declared <= MAX_STORED_BYTES,
    503,
    "STORAGE_CORRUPT",
    "Evidence failed its integrity check.",
  );
  const reader = response.body?.getReader();
  assert(reader, 503, "STORAGE_FAILED", "Evidence is temporarily unavailable.");
  const chunks: Buffer[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      assert(
        total <= MAX_STORED_BYTES,
        503,
        "STORAGE_CORRUPT",
        "Evidence failed its integrity check.",
      );
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, total);
}

export async function uploadCloudinaryEvidence(
  ownerId: string,
  original: Buffer,
) {
  const { base, authorization } = config();
  const { data, encoding } = encodeEvidence(original);
  const publicId = `priym-evidence/${ownerId}/${randomUUID()}.${encoding === "gzip" ? "gz" : "bin"}`;
  const form = new FormData();
  form.set("file", new Blob([new Uint8Array(data)]), "evidence");
  form.set("public_id", publicId);
  form.set("type", "authenticated");
  form.set("overwrite", "false");
  let response: Response;
  try {
    response = await fetch(`${base}/raw/upload`, {
      method: "POST",
      headers: { Authorization: authorization },
      body: form,
      signal: AbortSignal.timeout(60_000),
      cache: "no-store",
      redirect: "error",
    });
  } catch {
    assert(false, 503, "STORAGE_FAILED", "Cloudinary evidence upload failed.");
  }
  assert(response.ok, 503, "STORAGE_FAILED", "Cloudinary evidence upload failed.");
  const result = await response.json().catch(() => null);
  const validAssetId =
    typeof result?.asset_id === "string" &&
    /^[a-zA-Z0-9_-]+$/.test(result.asset_id);
  const validReceipt =
    validAssetId &&
    result.public_id === publicId &&
    result.resource_type === "raw" &&
    result.type === "authenticated" &&
    result.bytes === data.length;
  if (!validReceipt && validAssetId) {
    await deleteCloudinaryEvidence(`${PREFIX}${result.asset_id}:${encoding}`).catch(
      () => console.error("PRiym Cloudinary invalid-receipt cleanup needs retry"),
    );
  }
  assert(
    validReceipt,
    503,
    "STORAGE_FAILED",
    "Cloudinary returned an invalid evidence upload receipt.",
  );
  return {
    storageKey: `${PREFIX}${result.asset_id}:${encoding}`,
    storedSizeBytes: data.length,
    publicId,
  };
}

export async function downloadCloudinaryEvidence(
  key: string,
  expectedSize: number,
  expectedSha256: string,
) {
  const { assetId, encoding } = parseKey(key);
  const { base, authorization } = config();
  let response: Response;
  try {
    response = await fetch(
      `${base}/asset/download?asset_id=${encodeURIComponent(assetId)}`,
      {
        headers: { Authorization: authorization },
        signal: AbortSignal.timeout(60_000),
        cache: "no-store",
        redirect: "error",
      },
    );
  } catch {
    assert(false, 503, "STORAGE_FAILED", "Evidence is temporarily unavailable.");
  }
  assert(response.ok, 503, "STORAGE_FAILED", "Evidence is temporarily unavailable.");
  const data = await readLimited(response);
  return decodeEvidence(data, encoding, expectedSize, expectedSha256);
}

export async function deleteCloudinaryEvidence(key: string) {
  const { assetId } = parseKey(key);
  const { base, authorization } = config();
  const form = new URLSearchParams({ asset_id: assetId, invalidate: "true" });
  const response = await fetch(`${base}/asset/destroy`, {
    method: "POST",
    headers: { Authorization: authorization },
    body: form,
    signal: AbortSignal.timeout(30_000),
    cache: "no-store",
    redirect: "error",
  });
  assert(response.ok, 503, "STORAGE_FAILED", "Could not remove Cloudinary evidence.");
  const result = await response.json().catch(() => null);
  assert(
    result?.result === "ok" || result?.result === "not found",
    503,
    "STORAGE_FAILED",
    "Could not remove Cloudinary evidence.",
  );
}
