import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { assert } from "@/lib/errors";
import { MAX_FILE_BYTES, fileValidationError } from "@/lib/evidence-files";
import { requireScanner, scanEvidence } from "./malware";
export { MAX_FILE_BYTES } from "@/lib/evidence-files";
export function validateFile(bytes: Buffer, mime: string, name: string) {
  const error = fileValidationError(name, mime, bytes.length);
  assert(!error, 422, "FILE_SIZE", error || "Invalid file.");
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
function supabaseClient() {
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
  ).storage;
}
function supabase() {
  return supabaseClient().from(
    process.env.SUPABASE_STORAGE_BUCKET || "priym-evidence",
  );
}
export async function requireUploadStorage() {
  requireScanner();
  const provider = process.env.STORAGE_PROVIDER || "local";
  assert(
    ["local", "supabase"].includes(provider),
    503,
    "STORAGE_CONFIG",
    "Evidence storage is not configured. Contact an administrator.",
  );
  assert(
    !process.env.VERCEL || provider === "supabase",
    503,
    "STORAGE_CONFIG",
    "Evidence uploads are unavailable until an administrator connects private file storage.",
  );
  if (provider === "supabase") {
    const { data, error } = await supabaseClient().getBucket(
      process.env.SUPABASE_STORAGE_BUCKET || "priym-evidence",
    );
    assert(
      data && !error && data.public === false,
      503,
      "STORAGE_CONFIG",
      "Evidence storage must be an available private bucket. Contact an administrator.",
    );
    // Enforce this on the storage server as well as during finalization.
    assert(
      data.file_size_limit && Number(data.file_size_limit) <= MAX_FILE_BYTES,
      503,
      "STORAGE_CONFIG",
      "Set the evidence bucket's file-size limit to 10 MB or less before enabling uploads.",
    );
  }
}
export async function signedEvidenceUpload(key: string) {
  const { data, error } = await supabase().createSignedUploadUrl(key, {
    upsert: false,
  });
  assert(
    data && !error,
    503,
    "STORAGE_FAILED",
    "Could not prepare the upload. Please try again later.",
  );
  return data.signedUrl;
}
export async function stagedEvidence(key: string) {
  const { data, error } = await supabase().download(key);
  assert(
    data && !error,
    422,
    "UPLOAD_INCOMPLETE",
    "The file has not finished uploading. Please choose it again.",
  );
  assert(
    data.size > 0 && data.size <= MAX_FILE_BYTES,
    422,
    "FILE_SIZE",
    "Each file must be between 1 byte and 10 MB.",
  );
  return Buffer.from(await data.arrayBuffer());
}
export async function discardEvidence(key: string) {
  if (process.env.STORAGE_PROVIDER === "supabase") {
    const { error } = await supabase().remove([key]);
    if (error) throw new Error("Could not remove temporary evidence.");
  } else await unlink(localPath(key)).catch(() => {});
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
  await requireUploadStorage();
  const scanStatus = await scanEvidence(bytes, mime, fileName);
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
