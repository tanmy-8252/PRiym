# Vercel deployment through GitHub

Import `tanmy-8252/PRiym` into Vercel. Use the repository root (`./`), Next.js,
Node.js 24.x, and the `main` branch for Production. `vercel.json` sets installation
to `npm ci` and the build to `npm run vercel-build`. That command regenerates the
Prisma client, applies committed migrations, then builds Next.js. A failed
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

## First production administrator

The production database starts empty; local demo accounts are deliberately absent.
Provision the first administrator from a trusted machine after migrations. In a
fresh clone, install dependencies:

```sh
npm ci
```

Set `NODE_ENV=production`, the hosted `DATABASE_URL`, `AUTH_SECRET`, `AUDIT_SECRET`,
and `AUTH_URL` in a private operator environment. Also set
`BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_PASSWORD`
(a strong unique password) and `BOOTSTRAP_ADMIN_MFA_SECRET` (base32). Enroll that
MFA secret in the administrator's authenticator securely; it uses SHA-1,
six digits and a 30-second period. Then run:

```sh
npm run db:generate
npm run db:deploy
npm run bootstrap:admin
```

The bootstrap command refuses to create another Admin if one already exists.
Remove the bootstrap variables afterward. Sign in at `/login` with that individual
administrator account and its current authenticator code. Configure departments,
semesters, categories and point rules in the administrator dashboard. Registration
and password reset require verified email service configuration and maintenance.

## Verify the deployment

Visit `/api/health` and verify a healthy database response, then `/login`.
Confirm demo buttons are hidden, an unauthenticated `/dashboard` redirects to
login, and valid administrator credentials reach the dashboard. Changes to the
domain must also update `AUTH_URL`. Preserve `AUTH_SECRET` across deployments or
existing encrypted MFA secrets and sessions become unusable.

## Features requiring additional hosting services

This Vercel setup hosts the application and PostgreSQL-backed functionality.
Evidence uploads require further work before real use: Vercel limits function
request bodies to 4.5 MB, while PRiym permits 10 MB, and the current production
upload adapter requires ClamAV. Direct private uploads, an external malware scan
and a verified finalize step are needed. Keep the scanner requirement intact.
Queued reports currently need persistent file storage, which Vercel's local file
system does not provide. Small synchronous reports do not use that queue.

Set `EMAIL_PROVIDER=resend`, a verified `EMAIL_FROM` and `RESEND_API_KEY` for email.
A separate scheduler must invoke `GET /api/maintenance` every minute with
`Authorization: Bearer <CRON_SECRET>` to deliver queued email and run maintenance.
Vercel Hobby cron only supports a daily schedule, so this repository does not
install an incompatible minute schedule. A separate Node worker can run
`npm run worker` with the same environment. See [DEPLOYMENT.md](DEPLOYMENT.md) for
the Docker option that includes ClamAV and persistent runtime storage.

References: [Vercel GitHub integration](https://vercel.com/docs/git/vercel-for-github),
[Prisma on Vercel](https://www.prisma.io/docs/orm/v7/prisma-client/deployment/serverless/deploy-to-vercel),
[Vercel function limits](https://vercel.com/docs/functions/limitations), and
[Vercel cron plans](https://vercel.com/docs/cron-jobs/usage-and-pricing).
