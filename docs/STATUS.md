# Implementation status

## Delivered application

The archive contains the complete source of the runnable PRiym MVP, its four SQL migrations, repeatable synthetic seed, locked dependency manifest, configuration template, tests and deployment files. It does not contain a running database, uploaded evidence, credentials or installed dependencies.

Implemented:

- Student/Faculty registration, institutional-domain validation, email verification before Admin approval, single-use password reset, last-five-password protection and an email outbox.
- Auth.js sign-in, lockout, mandatory privileged-role TOTP, optional MFA enrollment, one-time recovery codes, session/device listing, individual/all-session revocation and inactivity warning.
- Student achievement metadata/evidence/drafts/resubmission; category/subcategory selection, collaborator tags, duplicates and reviewer routing.
- Faculty checklist approval/rejection/clarification/escalation, batch clarification, conflict-of-interest enforcement and Admin reassignment.
- Atomic approval/points/badges/events/notification/audit transactions with SQL-enforced immutable ledgers and audit records.
- Four-role dashboards, student merit history, faculty cohort, HOD analytics, leaderboards, visibility controls and public verified portfolios.
- Admin account pagination/search, CSV import/export, reset enforcement, department/default-verifier and academic-year/semester controls, archived honor rolls, category/checklist/rejection/indicator rules.
- Milestone, achievement/activity, semester and streak badge rules, edit/deactivate and audit-logged revocation.
- Authorized global search, URL filters, HOD/Admin saved filters, profile details and email preferences.
- CSV/XLSX/PDF achievement, summary, faculty SLA, batch, configured NAAC/NBA mapping, honor-roll and audit reports. Background reports expire after 24 hours; daily/weekly/monthly schedules use authorized institutional recipients.
- Persistent local private evidence and Supabase private-bucket adapter, file signatures/digests, production scanner enforcement, protected maintenance/worker for reminders, overdue escalation, expiry, report jobs and retried email.
- HMAC audit signatures, request metadata and signature-verification command; unit, SQL/service and live HTTP tests; Docker and PostgreSQL CI configuration.

## Production acceptance and optional extensions

This is a working MVP, not a claim that every expanded PRD feature or non-functional target has been certified. External mail/Supabase/ClamAV, real PostgreSQL deployment, load capacity, backups/restore, accessibility and institutional acceptance require validation in the target environment. NAAC/NBA exports use institution-configured mappings and explicitly identify unmapped records; institutional approval is required for accreditation use.

The simplified architecture uses PostgreSQL jobs and fresh database reads rather than Redis/BullMQ. Global security/service configuration stays in environment variables. TOTP with recovery codes is implemented; email-OTP MFA, account email changes, profile-photo resizing, editable notification templates, document-position annotations, weekly rank history and the full advanced-chart catalogue are extension work. Current comments attach to the achievement's review history. Monthly schedules currently use a 30-day interval. Background exports and their delivery use private local report storage, requiring a persistent Node/Docker volume. Vercel's full-size direct-upload/finalize transport is implemented with private Supabase quarantine, managed malware scanning and immutable finalized evidence; live operation requires configured provider credentials.

External provisioning and production validation are environment-specific; see the setup guides. Redemption, SSO and mobile clients remain Phase 2.
