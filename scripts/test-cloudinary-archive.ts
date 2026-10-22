import { createHash, randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import {
  deleteCloudinaryEvidence,
  downloadCloudinaryEvidence,
  uploadCloudinaryEvidence,
} from "../src/server/cloudinary-evidence";

loadEnvConfig(process.cwd());

// Synthetic data only: never use a student's evidence for a service probe.
const original = Buffer.from("PRiym synthetic storage probe\n".repeat(4096));
const sha256 = createHash("sha256").update(original).digest("hex");
let storageKey: string | undefined;
try {
  const started = performance.now();
  const uploaded = await uploadCloudinaryEvidence(randomUUID(), original);
  storageKey = uploaded.storageKey;
  const uploadMs = Math.round(performance.now() - started);
  const restored = await downloadCloudinaryEvidence(
    storageKey,
    original.length,
    sha256,
  );
  const downloadMs = Math.round(performance.now() - started - uploadMs);
  if (!restored.equals(original)) throw new Error("Restored bytes differ.");
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const unsignedUrl = `https://res.cloudinary.com/${cloudName}/raw/authenticated/${uploaded.publicId}`;
  const unsigned = await fetch(unsignedUrl, {
    redirect: "manual",
    signal: AbortSignal.timeout(30_000),
  });
  if (unsigned.ok || (unsigned.status >= 300 && unsigned.status < 400)) {
    throw new Error("Cloudinary allowed an unsigned evidence request.");
  }
  console.log(
    JSON.stringify({
      originalBytes: original.length,
      storedBytes: uploaded.storedSizeBytes,
      savedPercent: Number(
        ((1 - uploaded.storedSizeBytes / original.length) * 100).toFixed(1),
      ),
      uploadMs,
      downloadMs,
      sha256Identical: true,
      unsignedAccessStatus: unsigned.status,
    }),
  );
} finally {
  if (storageKey) {
    await deleteCloudinaryEvidence(storageKey);
    console.log("Synthetic Cloudinary asset deleted.");
  }
}
