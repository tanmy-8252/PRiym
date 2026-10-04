# Production evidence uploads

The achievement form attaches only completed uploads. A filename shown in a file chooser does not mean its contents reached storage or passed security checks. Failed uploads show the affected filename, the reason, and Retry/Remove controls. Submission waits until uploads finish and failures are resolved; each successful attachment is retained independently.

## Private storage

1. Sign in to Supabase and create a dedicated project for PRiym evidence on a suitable plan. Keep the existing PRiym PostgreSQL `DATABASE_URL`; Supabase is used for files, not a database migration.
2. Open Storage → Files → New bucket. Name it `priym-evidence`.
3. Leave **Public bucket off**. Enable **Restrict file size** and set **10 MB**. Enable **Restrict MIME types** with `application/pdf,image/jpeg,image/png,video/mp4`.
4. No public read/insert policies are needed. The server issues scoped upload capabilities; authorization-protected downloads use short-lived signed URLs.
5. From the project settings obtain the Project URL and a server service key (legacy `service_role`, or a server secret key). Enter the key privately in Vercel, never in source or chat, and never with a `NEXT_PUBLIC_` prefix.

## Malware scanner

Create/sign in to a Cloudmersive account and obtain an API key with Virus Scan access. Check its current request and file-size allowance before accepting users; quota exhaustion or service errors block uploads. The adapter sends file bytes to Cloudmersive's advanced scan endpoint. Make this processing clear to account owners. The provider describes its processing/security at [Virus Scan API](https://cloudmersive.com/virus-api) and its request/response contract at [API reference](https://api.cloudmersive.com/docs/virus.asp).

Production Vercel variables, scoped to **Production**:

```dotenv
STORAGE_PROVIDER=supabase
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_PRIVATE_SERVER_KEY
SUPABASE_STORAGE_BUCKET=priym-evidence
MALWARE_SCANNER=cloudmersive
CLOUDMERSIVE_API_KEY=YOUR_PRIVATE_SCANNER_KEY
```

Leave `CLAMSCAN_PATH` empty on Vercel. Redeploy after saving these settings. `npm run vercel-build` deploys the additive `EvidenceUpload` migration automatically. With another host run `npm run db:deploy`, then `npm run build` and `npm start`. No production demo seeding is needed.

## Verify

Sign in as an existing Student. Upload a real PDF or JPG, wait for `Uploaded`, then submit an otherwise valid achievement. Test a PDF between 4.5 and 10 MB to verify direct transfer. The initial request and finalize request contain metadata only; the file goes from the browser to a private quarantine object. The server verifies the actual byte length, signature, extension and scan result, then writes exactly the scanned bytes to a NEW permanent key and records the evidence/hash/audit event. A staging capability cannot overwrite finalized evidence. Other students cannot finalize the upload or view its evidence. Unscanned evidence cannot be attached or downloaded in production.

In development use the local environment template; local uploads remain `NOT_SCANNED_DEV`. Run `npm test`, `npm run test:integration`, `npm run test:e2e`, and `npm run build`. Automated integration tests use an isolated database and mocked external services; they do not validate live provider credentials or scan student files.

The authenticated `/api/mail/maintenance` cron clears expired staging objects (including abandoned/replayed objects) after their two-hour capability expires. Keep `CRON_SECRET` configured. Provider outages retain cleanup records for retry.
