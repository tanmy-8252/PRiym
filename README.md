# PRiym

Progress · Recognition · Innovation · Merit. A runnable full-stack MVP for Atria Institute of Technology, starting with CSE.

The source archive excludes `node_modules`, `.next`, caches, generated clients, private `.env` files, databases, uploads and development mail. `.env.example` contains placeholders and synthetic demo defaults. Setup generates private secrets locally.

All five uploaded documents are preserved in [`docs/source`](docs/source). The approved PRD controls behavior. [`Architecture`](docs/ARCHITECTURE.md) reconciles the folder document and implementation plan; [`Implementation status`](docs/STATUS.md) distinguishes working features from remaining PRD requirements.

## Quick start

Requires Node.js 24 LTS (22.12+ supported), npm, and a macOS/Linux shell.

```sh
unzip PRiym-Website.zip
cd PRiym-Website
npm run setup
npm run dev
```

In a second terminal, run `npm run worker` from the same folder to process emails, report jobs and reminders. For one cycle, use `npm run worker:once`.

Open **http://127.0.0.1:3000**. Setup installs locked dependencies, creates `.env` with random application secrets and a unique local demo authenticator secret, starts a persistent embedded PostgreSQL engine on port 54329, generates Prisma, applies migrations and seeds synthetic data. Files and database data live in the Git-ignored `.data/` directory.

Embedded PostgreSQL uses PGlite's PostgreSQL wire protocol, the Prisma PostgreSQL driver and SQL migrations. It is for development, not load testing or production. This option works in the execution environment where native PostgreSQL shared-memory initialization was blocked. CI and production configurations use standard PostgreSQL. Development uses webpack with file polling to avoid host watcher limits.

## Demo access

All demo accounts use `DEMO_PASSWORD` from `.env` (default `PriymDemo1!`).

| Role    | Email             |
| ------- | ----------------- |
| Student | student@atria.edu |
| Faculty | faculty@atria.edu |
| HOD     | hod@atria.edu     |
| Admin   | admin@atria.edu   |

**HOD/Admin require MFA.** Immediately before signing in, run:

```sh
npm run demo:otp
```

The command reads each exact seeded account's encrypted secret from the same database and environment as Next.js, prints its email/code and remaining validity, and waits for a fresh interval if a code was already used or is about to expire. Codes use SHA-1, 6 digits, a 30-second period and the current interval only; each is single-use per account. Student/Faculty need no code. To print just one account: `npm run demo:otp -- --role hod` (or `admin`). Never paste a previous code after its interval expires.

The role buttons use the configured `DEMO_PASSWORD`, including custom passwords. After changing demo configuration, restart `npm run dev` and run the repair command below. All roles land at `/dashboard`, which renders the role's own dashboard from the database; Faculty can open `/submissions`, HOD `/settings`, and Admin `/admin`.

To repair an existing local installation (with its database already running):

```sh
npm run demo:reset
npm run dev
# Second terminal, immediately before HOD/Admin login:
npm run demo:otp
```

`demo:reset` generates Prisma, applies committed migrations and reseeds the nine explicit synthetic accounts. It repairs passwords, roles, approval/verification, locks, optional MFA and TOTP replay state, re-encrypts HOD/Admin secrets using the current `AUTH_SECRET`, and revokes previous demo sessions/recovery codes/reset links. It preserves account IDs, achievements, points, evidence and institution accounts. Both `db:seed` and `demo:reset` refuse production, remote databases or `SEED_DEMO=false`. Valid existing application secrets are never rotated by setup. Demo buttons/passwords are unavailable in production.

Next.js and CLI commands share `.env*` precedence via `@next/env`: process environment, mode-specific `.env.local`, `.env.local`, mode-specific `.env`, then `.env` (test mode skips `.env.local`). Check overrides if changing `.env` has no effect. Use the same folder for the server, reset and OTP commands. Keep `AUTH_URL` aligned with your browser URL; development accepts `localhost`/`127.0.0.1`/`::1` aliases only on the same protocol and port. Production retains exact origin checks and mandatory HOD/Admin MFA.

The seed includes additional students/faculty and another department for access checks.

Try Student → Add achievement → upload evidence → Submit → sign in as Faculty in a separate session → complete checklist → Approve/Reject → refresh Student. A National Certification receives `50 × 1.5 × 1 = 75` points. Draft, rejected and clarification states award no points. Seed category values are demonstration configuration, not institution-approved production point values.

See [local login diagnosis and repairs](docs/LOGIN.md) for the observed causes and verification.

## Standard PostgreSQL

Stop the embedded database before reusing port 54329:

```sh
npm run db:embedded:stop
npm run setup -- docker        # Docker Desktop, PostgreSQL 16
# or:
npm run setup -- native        # PostgreSQL installed on the host
npm run dev
```

Docker/native modes use `postgresql://priym:priym@127.0.0.1:54329/priym`. For an existing database, set `DATABASE_URL` and `PG_POOL_MAX=10` in `.env`, then run `npm run setup -- existing`. Custom URLs are preserved. To switch back to embedded mode, set `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54329/postgres` and `PG_POOL_MAX=1`. The modes have separate data stores.

## Commands

```sh
npm run db:generate
npm run db:migrate -- --name change   # standard PostgreSQL: create migration
npm run db:deploy                    # apply committed migrations
npm run db:seed                      # repeatable local demo reset + sample data
npm run demo:reset                   # generate, migrate, repair local demo accounts
npm run demo:otp                     # fresh DB-backed HOD/Admin codes
npm run test:login                   # all four live Auth.js role logins at 127.0.0.1
npm run db:embedded                  # start embedded database
npm run db:embedded:stop
npm run db:stop                      # stop native database
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run test:integration
npm run test:http                    # live HTTP flow without launching a browser
npm run worker                       # email, reminders, background reports
npm run worker:once                  # process one cycle
npm run mail:inbox -- student@atria.edu # read the private local email inbox
npm run audit:verify                 # verify immutable audit signatures
npx playwright install chromium
npm run test:e2e
npm run build
npm start
```

Integration tests use a fresh in-memory PostgreSQL engine on port 54330. To test standard PostgreSQL, create an isolated database with `test` in its name:

```sh
TEST_DATABASE_URL=postgresql://priym:priym@localhost:5432/priym_test npm run test:integration
```

Browser tests require seeded accounts and a running development database, start/reuse the app, and add synthetic achievements. The scripted browser runner is blocked by this execution environment's macOS process restrictions; run it on an ordinary developer machine or the provided CI. The all-role `test:login` suite uses real HTTP requests, cookies, Auth.js callbacks, database sessions and RBAC dashboards without launching Chromium.

## Storage and security

Local files remain outside `public/`; downloads check the owner, assigned/mentoring faculty or department HOD. Admin document access requires an audited exception reason (`?reason=...`, at least 20 characters). Public portfolios show verified metadata without evidence and are private by default.

For Supabase, create a **private bucket** and configure `STORAGE_PROVIDER=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET`. The server issues 60-second download URLs only after authorization; the service key never reaches the client.

Files validate declared type, extension, signature and 10 MB size limit; retain SHA-256, filename, MIME type, byte size and scan state. Production uploads fail closed unless `CLAMSCAN_PATH` is configured and scanning succeeds. Local demo uploads are explicitly marked `NOT_SCANNED_DEV`. Keep ClamAV signatures current.

Auth.js sessions reference database records and every protected request rereads role/status. Admin account changes revoke sessions. Point and audit records are append-only with SQL triggers; awards are transactional and unique per submission.

## Registration, email and reports

Students and Faculty can register at `/account?mode=register`. They must verify the emailed link and receive Admin approval. HOD/Admin accounts use controlled provisioning. Verification links expire in 24 hours, reset links in 1 hour; both are single-use. For local development, emails are written under `.data/mail` by the worker. `npm run mail:inbox -- user@atria.edu` displays that user's development messages. No real email is sent with the default configuration.

Production email uses `EMAIL_PROVIDER=resend`, a verified `EMAIL_FROM` and `RESEND_API_KEY`. Keep these in the host's private environment. Security emails bypass notification preferences. Failed delivery retries with backoff and records a failure after five attempts.

Reports over 500 records are queued and appear under Reports after the worker runs. Download links require authorized accounts and expire after 24 hours. HOD/Admin can schedule reports. Institution controls configure NAAC indicators and program outcomes by category; exports mark unconfigured records `UNMAPPED`. Reports are not institution-certified merely because a file is generated.

## Manual installation and database commands

For an existing PostgreSQL database (or Docker), use this explicit sequence instead of the quick-start script:

```sh
npm ci
node scripts/create-env.mjs
# Edit .env: DATABASE_URL for your PostgreSQL database and PG_POOL_MAX=10.
# For bundled Docker PostgreSQL: docker compose up -d --wait db
# Its DATABASE_URL is postgresql://priym:priym@127.0.0.1:54329/priym
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
# In a second terminal:
npm run worker
```

The demo seed requires `SEED_DEMO=true`, `DEMO_PASSWORD` and `DEMO_TOTP_SECRET`; it refuses production execution. SQL migrations are committed under `prisma/migrations`. `db:deploy` applies existing migrations; `db:migrate -- --name change` creates future migrations against standard PostgreSQL. Production runtime: `npm run build`, then `npm start` (see deployment notes for database release steps, storage and scheduling).

See [`Deployment`](docs/DEPLOYMENT.md) for Docker, migrations, private storage and maintenance, and [`Vercel through GitHub`](docs/VERCEL.md) for hosted PostgreSQL, production variables and the first administrator. See `docs/STATUS.md` for the delivered scope, optional extensions and target-environment acceptance work.
# PRiym
