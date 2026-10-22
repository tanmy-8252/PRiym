import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { gunzipSync } from "node:zlib";
import { encodeEvidence } from "../src/server/cloudinary-evidence";

const files = process.argv.slice(2);
if (!files.length) {
  console.error("Usage: npm run evidence:benchmark -- /absolute/path/file ...");
  process.exitCode = 1;
} else {
  for (const file of files) {
    const original = await readFile(file);
    const { data, encoding } = encodeEvidence(original);
    const restored = encoding === "gzip" ? gunzipSync(data) : data;
    const hash = (bytes: Buffer) =>
      createHash("sha256").update(bytes).digest("hex");
    const identical = hash(original) === hash(restored) && original.equals(restored);
    console.log(
      JSON.stringify({
        file: basename(file),
        originalBytes: original.length,
        storedBytes: data.length,
        savedPercent: Number(
          ((1 - data.length / original.length) * 100).toFixed(1),
        ),
        encoding,
        identical,
      }),
    );
    if (!identical) process.exitCode = 1;
  }
}
