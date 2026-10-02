# Architecture decisions

The approved PRD §17 and implementation plan §3 support one Next.js application with route handlers replacing a separate backend. The folder document's Turborepo, extra packages and reserved API add setup cost for one deployment. This build uses one application, one lockfile and one schema, with modules that can become workspace packages when another consumer exists.

`src/app` contains pages/thin handlers, `src/server` business services and integrations, `src/lib` validation/rules/crypto/database, `src/components` UI, and `prisma` schema/migrations/seed. Dependencies are pinned: Next.js App Router, TypeScript, Tailwind 4, accessible native controls in a shadcn-style UI, Prisma 7/PostgreSQL, Auth.js v5, Zod 4, optional Supabase, Vitest and Playwright.

The official [Auth.js credentials guide](https://authjs.dev/getting-started/providers/credentials) makes persistence the application's responsibility. Prisma stores users/password hashes and database sessions referenced by JWTs. Every protected request verifies the current account role/status and session, so revocation works without waiting for token expiry. Auth.js v5 remains a pinned beta dependency.

Submission transactions validate semester/category/evidence ownership and route mentor → category verifier → department verifier. Advisory locking makes duplicate warnings consistent. Review decisions use version checks and a unique submission ledger reference. Approval, points, badges, notification and audit events commit together. Immutable SQL triggers protect ledger/audit records. The approval point snapshot preserves historical values after configuration changes.

Interpretations:

- Current/preceding semester window (BR-002) takes priority over §11's broader 18-month validation.
- BR-005 permits rejected submissions to be resubmitted; both rejection and clarification support up to three attempts.
- Final points round to the nearest integer; the PRD has no rounding rule.
- Seed categories/base points are provisional demo configuration. The earlier proposal's tiers/redemption amounts do not replace the approved formula; redemption is Phase 2.
- Portfolios default private with explicit opt-in. Admin evidence exceptions follow BR-014 despite general platform access.
- Checklists are snapshotted per submission; milestone badges currently evaluate cumulative points.
- Direct live queries initially replace Redis caching. Additional queues/cache infrastructure is deferred until needed and is tracked in STATUS.md.

Local tests use embedded PostgreSQL because native startup is blocked here. The CI workflow uses PostgreSQL 16. This distinction matters: embedded tests are not evidence of production concurrency/load performance.
