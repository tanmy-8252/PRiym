export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const EVIDENCE_TYPES = {
  "application/pdf": /\.pdf$/i,
  "image/png": /\.png$/i,
  "image/jpeg": /\.jpe?g$/i,
  "video/mp4": /\.mp4$/i,
};

export function evidenceMimeType(name: string, declared: string) {
  // Some browsers leave File.type empty even for a supported extension.
  if (declared) return declared.toLowerCase().split(";")[0].trim();
  return (
    Object.entries(EVIDENCE_TYPES).find(([, extension]) =>
      extension.test(name),
    )?.[0] || "application/octet-stream"
  );
}

export function fileValidationError(name: string, mime: string, size: number) {
  if (!Number.isInteger(size) || size < 1 || size > MAX_FILE_BYTES)
    return "Each file must be between 1 byte and 10 MB.";
  const extension = EVIDENCE_TYPES[mime as keyof typeof EVIDENCE_TYPES];
  if (!extension?.test(name)) return "Choose a PDF, JPG, PNG or MP4 file.";
  return null;
}
