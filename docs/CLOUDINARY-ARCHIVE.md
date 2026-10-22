# Cloudinary lossless archive pilot

This optional pilot changes where *clean, finalized* evidence is stored. It does not change upload quarantine, authentication, authorization, or malware scanning. Keep `STORAGE_PROVIDER=supabase` and a configured scanner. Do not turn this on in production until a real-account upload/download test passes.

## Setup

1. In Cloudinary Console, locate your **cloud name**, **API key**, and **API secret**. Keep the secret private. Create a dedicated API key if your account permits it.
2. In a local `.env` or Vercel's server-side environment variables set:

   ```text
   STORAGE_PROVIDER=supabase
   EVIDENCE_ARCHIVE_PROVIDER=cloudinary
   CLOUDINARY_CLOUD_NAME=<your cloud name>
   CLOUDINARY_API_KEY=<your API key>
   CLOUDINARY_API_SECRET=<your API secret>
   ```

   Keep `SUPABASE_*` and `SCANII_*` (or another supported scanner) configured. Never prefix Cloudinary credentials with `NEXT_PUBLIC_` or commit them.
3. Upload a non-sensitive PDF, JPG, PNG, and MP4 using a Student account. After each upload, confirm the evidence can be viewed by its owner and authorized reviewer, cannot be viewed by another student, and downloads to exactly the original SHA-256 and size.
4. Compare real evidence samples with `npm run evidence:benchmark -- /absolute/path/file.pdf /absolute/path/photo.jpg`. This only reads local files and prints sizes; it uploads nothing. Cloudinary is useful for storage saving only when the archive size reduction is material after accounting for its quota and the extra download processing.

Before enabling the pilot, run `npm run evidence:cloudinary:probe` from a local environment with the three Cloudinary credentials. It uploads one synthetic object, verifies exact restoration and denied unsigned access, prints timing and size, and deletes the object. If the probe fails, investigate before enabling the archive provider. The probe does not use student evidence or the malware scanner; it checks only the Cloudinary storage adapter.

Cloudinary stores the final object as an `authenticated` raw asset. The Cloudinary API key and secret stay on the server. PRiym stores Cloudinary's immutable asset ID and the encoding in the existing `storageKey`; old Supabase keys remain readable without a migration. The server retrieves a Cloudinary object only after checking the user's access, caps its size, decompresses when needed, and verifies the original size and SHA-256 before streaming it to the browser. Cloudinary is not used for public evidence links.

Compression is gzip level 6. It is used only if it saves at least 1 KiB and 5%; otherwise the file is stored unchanged as a private raw asset. JPEG and MP4 evidence often offers little storage saving. The original file is scanned *before* compression; this pilot does not rely on a scanner examining a compressed wrapper. Uploaded originals in the Supabase quarantine are removed after successful finalization.

To stop archiving new evidence in Cloudinary, set `EVIDENCE_ARCHIVE_PROVIDER=supabase`. Keep `CLOUDINARY_*` server credentials available while any previously archived evidence must remain downloadable. Do not delete Cloudinary assets merely because the setting is changed.

## Limits and decision

This pilot still needs both Supabase (size-limited quarantine) and the malware scanner. Cloudinary alone does not compress and restore exact original bytes. Cloudinary may impose account-specific quotas and charges; check the account dashboard before enabling. The browser's direct upload to Cloudinary is deliberately not used because Cloudinary upload presets do not provide a per-preset server-enforced 10 MB limit. No production switch should be made based solely on mocked tests or synthetic files.

| Measure | Current Supabase archive | Cloudinary archive pilot |
| --- | --- | --- |
| Storage accounts required | Supabase | Supabase plus Cloudinary |
| Stored final bytes | Original evidence | Lossless gzip when at least 5% and 1 KiB smaller; otherwise original |
| Browser download | Short-lived signed Supabase URL | PRiym retrieves, verifies, and streams the original bytes |
| Malware scan | Original bytes before storage | Same original-byte scan before storage |
| Existing files | Read normally | Read normally from Supabase |

In a local trial, two PRiym UI screenshots saved 18.1% and 20.0% with exact restoration. This is not a representative evidence corpus. The pilot adds a second storage account and a server-mediated download, so it is not yet demonstrably better than the current setup. Keep the default `EVIDENCE_ARCHIVE_PROVIDER=supabase` until the live probe and representative benchmarks justify a switch.
