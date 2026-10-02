import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createClient } from "@supabase/supabase-js";
import { assert } from "@/lib/errors";
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export function validateFile(bytes: Buffer, mime: string, name: string) {
  assert(
    bytes.length > 0 && bytes.length <= MAX_FILE_BYTES,
    422,
    "FILE_SIZE",
    "Each file must be between 1 byte and 10 MB.",
  );
  const valid =
    (mime === "application/pdf" &&
      bytes.subarray(0, 5).toString() === "%PDF-" &&
      /\.pdf$/i.test(name)) ||
    (mime === "image/png" &&
      bytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
      /\.png$/i.test(name)) ||
    (mime === "image/jpeg" &&
      bytes[0] === 255 &&
      bytes[1] === 216 &&
      bytes[2] === 255 &&
      /\.jpe?g$/i.test(name)) ||
    (mime === "video/mp4" &&
      bytes.subarray(4, 8).toString() === "ftyp" &&
      /\.mp4$/i.test(name));
  assert(
    valid,
    422,
    "INVALID_FILE",
    "Upload a PDF, JPG, PNG or MP4 with matching file content.",
  );
}
function supabase() {
  assert(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
    500,
    "STORAGE_CONFIG",
    "Supabase storage is not configured.",
  );
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  ).storage.from(process.env.SUPABASE_STORAGE_BUCKET || "priym-evidence");
}
function localPath(key: string) {
  assert(
    /^[a-f0-9-]+\/[a-f0-9-]+$/.test(key),
    400,
    "INVALID_KEY",
    "Invalid storage path.",
  );
  return path.join(
    // Uploaded files are runtime data and must never enter the deployment bundle.
    /* turbopackIgnore: true */
    process.cwd(),
    process.env.UPLOAD_DIR || ".data/uploads",
    key,
  );
}
export async function storeEvidence(
  ownerId: string,
  bytes: Buffer,
  mime: string,
  fileName: string,
) {
  validateFile(bytes, mime, fileName);
  let scanStatus = "NOT_SCANNED_DEV";
  const scanner = process.env.CLAMSCAN_PATH;
  assert(
    scanner || process.env.NODE_ENV !== "production",
    503,
    "SCANNER_REQUIRED",
    "Production uploads require a configured malware scanner.",
  );
  if (scanner) {
    const temp = path.join(process.cwd(), ".data", "scan", randomUUID());
    await mkdir(path.dirname(temp), { recursive: true });
    await writeFile(temp, bytes, { mode: 0o600 });
    try {
      await promisify(execFile)(scanner, ["--no-summary", temp], {
        timeout: 30000,
      });
      scanStatus = "CLEAN";
    } catch {
      assert(
        false,
        422,
        "SCAN_FAILED",
        "This document could not pass the malware scan.",
      );
    } finally {
      await unlink(temp);
    }
  }
  const storageKey = `${ownerId}/${randomUUID()}`;
  if (process.env.STORAGE_PROVIDER === "supabase") {
    const { error } = await supabase().upload(storageKey, bytes, {
      contentType: mime,
      upsert: false,
    });
    assert(!error, 503, "STORAGE_FAILED", "Upload failed. Try again later.");
  } else {
    const target = localPath(storageKey);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, bytes, { mode: 0o600 });
  }
  return {
    storageKey,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    scanStatus,
    sizeBytes: bytes.length,
    mimeType: mime,
    fileName: path
      .basename(fileName)
      .replace(/[\r\n"\\]/g, "_")
      .slice(0, 200),
  };
}
export async function retrieveEvidence(key: string) {
  if (process.env.STORAGE_PROVIDER === "supabase") {
    const { data, error } = await supabase().createSignedUrl(key, 60);
    assert(
      data && !error,
      503,
      "STORAGE_FAILED",
      "Evidence is temporarily unavailable.",
    );
    return { url: data.signedUrl };
  }
  return { bytes: await readFile(localPath(key)) };
}
