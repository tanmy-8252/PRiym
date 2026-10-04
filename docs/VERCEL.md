# Vercel deployment through GitHub

Import `tanmy-8252/PRiym` into Vercel. Use the repository root (`./`), Next.js,
Node.js 24.x, and the `main` branch for Production. `vercel.json` sets installation
to `npm ci` and the build to `npm run vercel-build`. That command regenerates the
Prisma client, applies committed migrations, optionally provisions the first Admin
when explicitly enabled, then builds Next.js. A failed
migration stops the deployment. Subsequent pushes to `main` deploy automatically.

## Database and environment

Create a hosted PostgreSQL database through Vercel Storage/Marketplace and connect
it to this project. Select a free plan if available; review provider terms and
pricing before confirming. The current Prisma adapter needs a standard
`postgresql://` connection, not a `prisma://` or `prisma+postgres://` proxy URL.
Use the provider's pooled connection as `DATABASE_URL`; optionally set its direct
connection as `DIRECT_URL` (or `DATABASE_URL_UNPOOLED`) for migrations.

Use [vercel.env.example](vercel.env.example) as the variable checklist. Enter real
values privately in Vercel, never GitHub. Generate three separate random secrets:

```sh
node -e 'console.log(require("node:crypto").randomBytes(48).toString("base64url"))'
```

Run this separately for `AUTH_SECRET`, `AUDIT_SECRET`, and `CRON_SECRET`.
Set `AUTH_URL` to the exact HTTPS production domain shown by Vercel. Keep the two
demo flags false. Do not upload a local `.env` or run the demo seed remotely.
Set production database credentials and secrets for **Production only**. Preview
deployments need their own database and secrets; do not let branch builds migrate
or access the production database. Redeploy after changing environment variables.

## First production administrator and email

The production database starts empty; local demo accounts are deliberately absent.
Follow [REGISTRATION-SETUP.md](REGISTRATION-SETUP.md) for Gmail email delivery,
private authenticator enrollment and one-time Admin/CSE provisioning through
Vercel. That method uses the existing production encryption and audit secrets.
Remove all `BOOTSTRAP_ADMIN_*` settings after success, then redeploy. No public
endpoint can provision an Admin or bypass email verification/approval.

The same guide includes a trusted-machine alternative with an isolated private
`.env.operator`, `npm run production:bootstrap`, and a read-only
`npm run production:check`. Never substitute local demo secrets for production
secrets or run the demo seed on a hosted database.

## Verify the deployment

Visit `/api/health` and verify a healthy database response, then `/login`.
Confirm demo buttons are hidden, an unauthenticated `/dashboard` redirects to
login, and valid administrator credentials reach the dashboard. Changes to the
domain must also update `AUTH_URL`. Preserve `AUTH_SECRET` across deployments or
existing encrypted MFA secrets and sessions become unusable.

## Features requiring additional hosting services

This Vercel setup hosts the application and PostgreSQL-backed functionality.
Evidence uses direct uploads to private Supabase storage, followed by server-side
validation, managed malware scanning and a verified finalize step. This avoids
Vercel's 4.5 MB function request-body limit while retaining the 10 MB per-file
limit. Configure the private bucket and scanner using [EVIDENCE-SETUP.md](EVIDENCE-SETUP.md).
Uploading remains unavailable until both services are configured; scanning cannot be bypassed.
Queued reports currently need persistent file storage, which Vercel's local file
system does not provide. Small synchronous reports do not use that queue.

Email supports Gmail SMTP or Resend; see the registration guide for exact
variables. Account emails are attempted immediately after the API response.
The included Vercel cron invokes the secured `/api/mail/maintenance` endpoint
at 06:00 UTC daily to retry due messages; this is compatible with Hobby.
For more frequent retries, use a separate authorized scheduler or Node worker.
Do not use the broader `/api/maintenance` job on Vercel until queued reports
have persistent storage. On a persistent Node/Docker host, `npm run worker`
can process email, reminders and reports with the complete environment.

References: [Vercel GitHub integration](https://vercel.com/docs/git/vercel-for-github),
[Prisma on Vercel](https://www.prisma.io/docs/orm/v7/prisma-client/deployment/serverless/deploy-to-vercel),
[Vercel function limits](https://vercel.com/docs/functions/limitations), and
[Vercel cron plans](https://vercel.com/docs/cron-jobs/usage-and-pricing).
