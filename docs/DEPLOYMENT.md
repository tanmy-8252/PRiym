# Deployment setup

A Node/Docker host with PostgreSQL and private Supabase supports the 10 MB evidence limit without serverless body limits. The Dockerfile produces standalone Next.js output and includes ClamAV. Mount current signatures into `/var/lib/clamav` and maintain them; scanner failures block uploads.

```sh
npm ci
npm run db:generate
npm run db:deploy
docker build -t priym:pilot .
docker run --rm -p 3000:3000 --env-file .env.production \
  -v /absolute/path/clamav-signatures:/var/lib/clamav:ro \
  -v /absolute/path/priym-runtime-data:/app/.data priym:pilot
```

Set a managed PostgreSQL TLS connection, appropriate `PG_POOL_MAX`, unique random `AUTH_SECRET`/`AUDIT_SECRET`/`CRON_SECRET`, real HTTPS `AUTH_URL`, institutional domains and private Supabase credentials. Set `SEED_DEMO=false` and `NEXT_PUBLIC_DEMO_MODE=false`. Use individual MFA secrets for privileged users. The first production Admin is provisioned once with `npm run bootstrap:admin`. Set private `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_PASSWORD` and a base32 `BOOTSTRAP_ADMIN_MFA_SECRET` in the operator environment after migrations. Enroll that secret in the administrator’s authenticator securely. The command refuses to run if any Admin already exists; remove all bootstrap variables afterward. The demo seed is not a production bootstrap process.

Run migrations as a separate release step using migration credentials. The web container does not ship the migration CLI. Use a restricted runtime database account without schema/trigger-altering privilege. Configure database backups and recovery drills before the pilot.

Vercel: use this project as the root, `npm ci`, `npm run build`, managed PostgreSQL and private Supabase. Its request-body limit is smaller than 10 MB. Complete direct signed upload/finalize before accepting full-size evidence there, or host the pilot on Node/Docker. Local storage is not persistent on Vercel.

Set `EMAIL_PROVIDER=resend`, a verified `EMAIL_FROM` and `RESEND_API_KEY` for mail. The API adapter follows [Resend Send Email](https://resend.com/docs/api-reference/emails/send-email) and uses [idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys) to reduce duplicate delivery. In development, `EMAIL_PROVIDER=file` writes a private local inbox.

Schedule a minute-by-minute GET `/api/maintenance` with `Authorization: Bearer <CRON_SECRET>` using the host scheduler. This processes email, report jobs, reminders and expiry. Alternatively run `npm run worker` on a Node host with the complete installed project; the standalone web image uses the secured endpoint. No schedule was installed. `/api/health` returns 503 when the database is unavailable; connect an external monitor.

The CI workflow runs lint, types, unit coverage, standard PostgreSQL integration tests, browser journeys and production build. It contains no deployment credentials or automatic production publication. Review `STATUS.md` scope and validate external storage/scanner, email, point rules, backup recovery and pilot acceptance before real users.
