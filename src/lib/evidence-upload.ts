import { evidenceMimeType, fileValidationError } from "./evidence-files";
export type UploadedEvidence = { id: string; fileName: string };

async function responseData<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      body?.error?.message ||
        (response.status === 413
          ? "This file was too large for the upload service. Please try a smaller file."
          : response.status === 401
            ? "Your session expired. Please sign in again."
            : "The upload could not finish. Please try again."),
    );
  }
  if (!body?.data)
    throw new Error(
      "The upload service returned an incomplete response. Please try again.",
    );
  return body.data as T;
}

export async function uploadEvidenceFile(
  file: File,
): Promise<UploadedEvidence> {
  const mimeType = evidenceMimeType(file.name, file.type);
  const error = fileValidationError(file.name, mimeType, file.size);
  if (error) throw new Error(error);
  const preparation = await responseData<{
    transport: "server" | "direct";
    id?: string;
    uploadUrl?: string;
  }>(
    await fetch("/api/v1/evidence/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        mimeType,
        sizeBytes: file.size,
      }),
    }),
  );
  if (preparation.transport === "server") {
    return responseData<UploadedEvidence>(
      await fetch(`/api/v1/evidence?name=${encodeURIComponent(file.name)}`, {
        method: "POST",
        headers: { "Content-Type": mimeType },
        body: file,
      }),
    );
  }
  if (!preparation.id || !preparation.uploadUrl)
    throw new Error("Could not prepare the upload. Please try again.");
  const form = new FormData();
  form.append("cacheControl", "0");
  form.append("", new Blob([file], { type: mimeType }), file.name);
  // This capability grants upload access to ONE quarantine object, never a service key.
  const transferred = await fetch(preparation.uploadUrl, {
    method: "PUT",
    headers: { "x-upsert": "false" },
    body: form,
    credentials: "omit",
    referrerPolicy: "no-referrer",
  });
  if (!transferred.ok)
    throw new Error(
      transferred.status === 413
        ? "This file exceeds the storage size limit. Choose a smaller file."
        : "The file could not reach storage. Check your connection and retry the upload.",
    );
  return responseData<UploadedEvidence>(
    await fetch(`/api/v1/evidence/uploads/${preparation.id}/finalize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }),
  );
}
