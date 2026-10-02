# Verification results

Executed against the packaged source project:

| Check                                | Result                                                                                        |
| ------------------------------------ | --------------------------------------------------------------------------------------------- |
| Clean source installation            | Passed; 687 packages installed from lockfile in a fresh source copy                           |
| Fresh database migration and seed    | Passed; all four migrations applied to a separate embedded database, synthetic seed completed |
| ESLint                               | Passed                                                                                        |
| TypeScript                           | Passed                                                                                        |
| Unit tests                           | 30 passed                                                                                     |
| PostgreSQL service integration tests | 23 passed against fresh SQL migrations                                                        |
| Live HTTP end-to-end workflow        | Passed; also passed as part of the full Playwright run                                        |
| Full Playwright run                  | 2 passed; 2 browser journeys blocked at native Chromium launch by host process permissions    |
| Four-role Auth.js regression         | 5 passed; Student/Faculty/HOD/Admin sessions, redirects, dashboard RBAC and negative cases    |
| Production build                     | Passed without build warnings                                                                 |
| Production server                    | Student/Admin session/dashboard checks, demo password absent, strict origin checks verified   |
| Audit integrity                      | All 165 audit entries at verification time passed                                             |
| Dependency installation audit        | No known vulnerabilities reported                                                             |
| Source ZIP                           | Integrity, required files, exclusions and private environment-secret checks passed            |

The live HTTP test signs in through Auth.js, uploads a real synthetic PDF, submits as Student, approves as Faculty, checks the 75-point award and Student status, rejects another approval attempt, checks evidence authorization, verifies role/CSRF restrictions and downloads a real PDF report. It loads Student and HOD protected pages. Repeated runs use unique claims and respect one-time TOTP intervals.

The 23 integration tests cover approval concurrency, rejection without points, clarification/resubmission, HOD escalation, ownership/department boundaries, duplicate/stolen evidence, database-enforced immutability, lockout, TOTP/recovery replay, deactivation/session revocation, registration and verification before approval, reset password history and single-use tokens, conflict-of-interest reassignment, category/activity badges, report role restrictions, background download expiry and role-change invalidation, honor-roll archival and the local mail outbox. Canonical audit-signature unit tests cover PostgreSQL JSONB key reordering and tamper detection.

For the clean installation check, a workspace-local npm cache avoided this host's restricted default cache. A separate test database ran on port 54331 so the working development database was preserved. Installation generated a new private `.env`; none of those values enter the archive.

Chromium was downloaded to the workspace and the browser suite retried. Both browser journeys failed before opening the app because macOS denied Chromium's Mach bootstrap/process operation. The source includes the browser tests and a Linux CI workflow. This is recorded as an environment limitation, not a passing browser check.

Earlier interactive browser checks verified sign-in, dashboard rendering and form entry; a screenshot is included under `docs/screenshots`. Standard PostgreSQL CI, Docker image execution, production mail/Supabase/scanning, performance, accessibility, backups/recovery and accreditation acceptance were not externally validated here. See `STATUS.md` for scope and extensions.

Local login repairs, observations and reproducible commands are recorded in [LOGIN.md](LOGIN.md). The latest build used `NEXT_DIST_DIR=.next-check npm run build` to preserve the running development app; default `npm run build` still uses `.next`.

The refreshed login release also passed a fresh `npm ci`, environment creation, Prisma generation, TypeScript and all 30 unit tests in a separate source copy. A workspace-local `XDG_CACHE_HOME` was used for Prisma because this agent cannot write to the host home cache.
