# Production evidence uploads

The achievement form attaches only completed uploads. A filename shown in a file chooser does not mean its contents reached storage or passed security checks. Failed uploads show the affected filename, the reason, and Retry/Remove controls. Submission waits until uploads finish and failures are resolved; each successful attachment is retained independently.

## Private storage

1. Sign in to Supabase and create a dedicated project for PRiym evidence on a suitable plan. Keep the existing PRiym PostgreSQL `DATABASE_URL`; Supabase is used for files, not a database migration.
2. Open Storage → Files → New bucket. Name it `priym-evidence`.
3. Leave **Public bucket off**. Enable **Restrict file size** and set **10 MB**. Enable **Restrict MIME types** with `application/pdf,image/jpeg,image/png,video/mp4`.
4. No public read/insert policies are needed. The server issues scoped upload capabilities; authorization-protected downloads use short-lived signed URLs.
5. From the project settings obtain the Project URL and a server service key (legacy `service_role`, or a server secret key). Enter the key privately in Vercel, never in source or chat, and never with a `NEXT_PUBLIC_` prefix.

## Scanii trial setup

1. Open [Scanii](https://www.scanii.com/) and create/sign in to your account yourself. The signup currently offers free credits without a credit card. Check Account → Usage for your actual balance and expiry; do not assume unlimited or recurring free scans. Do not select a paid plan unless you intend to subscribe. See [pricing](https://www.scanii.com/pricing) and [credit usage](https://docs.scanii.com/article/130-do-files-credits-roll-over).
2. In the account's API keys area, create a dedicated key for PRiym. Keep the key **active** and enable **Malware** detection. Disable **NSFW image** and **NSFW language** detection. PRiym requires a malware-only key to prevent unrelated processing. Detection engines are [configured per API key](https://docs.scanii.com/article/149-how-do-the-different-detection-engines-work).
3. Copy the **API key** and its matching **API secret** privately into Vercel → PRiym → Settings → Environment Variables, scoped to **Production**. They are two different values; neither is your Scanii account password. Never put either in chat, source, screenshots or a `NEXT_PUBLIC_` variable.
4. Set `MALWARE_SCANNER=scanii` and `SCANII_REGION=ap2` (Singapore). Supported alternatives are `us1`, `eu1`, `eu2`, `ap1`, and `ca1`; these select fixed [regional endpoints](https://docs.scanii.com/article/162-api-version-2-2). An arbitrary URL is not accepted.
5. Confirm that the four Supabase variables below are also saved and that the bucket is private with the 10 MB limit. Leave `CLAMSCAN_PATH` empty on Vercel. Redeploy after saving the settings.

Files go to Scanii for malware analysis and to Supabase for private storage. Make this processing clear to account owners. According to Scanii's [security overview](https://docs.scanii.com/article/122-security-overview), file contents are discarded after analysis, while analysis metadata can be retained for up to 400 days. PRiym sends no custom student identifiers, original filename, or storage URL; the document's contents still reach the scanner. Optional image/language detection is disabled. The [API contract](https://github.com/scanii/openapi/blob/main/src/v22.yaml) documents authentication and completed scan results.

Production Vercel variables, scoped to **Production**:

```dotenv
STORAGE_PROVIDER=supabase
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_PRIVATE_SERVER_KEY
SUPABASE_STORAGE_BUCKET=priym-evidence
MALWARE_SCANNER=scanii
SCANII_API_KEY=YOUR_PRIVATE_SCANNER_KEY
SCANII_API_SECRET=YOUR_MATCHING_PRIVATE_SCANNER_SECRET
SCANII_REGION=ap2
```

`npm run vercel-build` deploys the additive `EvidenceUpload` migration automatically. Switching scanners requires no new migration. With another host run `npm run db:deploy`, then `npm run build` and `npm start`. No production demo seeding is needed.

PRiym checks the exact key's active state, malware-only detection configuration and available balance before each file scan. Scanii account responses can identify that sole malware category as `MALWARE_DETECTION` or the older `MALWARE`; both are accepted, while any extra category is rejected. It waits for a completed synchronous result, verifies the processed byte count and checksum, and accepts only an empty findings array. Wrong credentials, disabled detection, incomplete results, network failures and exhausted credits block uploads. Scanii's response uses SHA-1 for the provider checksum; PRiym continues recording SHA-256 for its own evidence digest.

Cloudmersive remains supported as an alternative: set `MALWARE_SCANNER=cloudmersive` and `CLOUDMERSIVE_API_KEY` with Virus Scan access. Its [advanced scan API](https://api.cloudmersive.com/docs/virus.asp) receives file bytes and rejects threats/unsafe content. Check its current request and file-size allowance. A persistent Node/Docker host can instead use a maintained `CLAMSCAN_PATH`; Vercel cannot use a local scanner executable. Production never falls back to unscanned uploads.

## Verify

Sign in as an existing Student. First upload a synthetic PDF/JPG and wait for `Uploaded`; do not submit a fake achievement for faculty review. Then submit an otherwise valid achievement with its genuine evidence. Test a PDF between 4.5 and 10 MB to verify direct transfer. The initial request and finalize request contain metadata only; the file goes from the browser to a private quarantine object. The server verifies the actual byte length, signature, extension and scan result, then writes exactly the scanned bytes to a NEW permanent key and records the evidence/hash/audit event. A staging capability cannot overwrite finalized evidence. Other students cannot finalize the upload or view its evidence. Unscanned evidence cannot be attached or downloaded in production.

In development use the local environment template; local uploads remain `NOT_SCANNED_DEV`. Run `npm test`, `npm run test:integration`, `npm run test:e2e`, and `npm run build`. Automated integration tests use an isolated database and mocked external services; they do not validate live provider credentials or scan student files.

The authenticated `/api/mail/maintenance` cron clears expired staging objects (including abandoned/replayed objects) after their two-hour capability expires. Keep `CRON_SECRET` configured. Provider outages retain cleanup records for retry.
