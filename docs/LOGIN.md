# Local login diagnosis and repair

The local database at `127.0.0.1:54329/postgres` contained all four named demo users. Their bcrypt hashes verified against `PriymDemo1!`; all were active, email-verified and unlocked. Student/Faculty had no MFA. HOD/Admin encrypted secrets were readable using the current `AUTH_SECRET` and matched the local seed configuration. Auth.js JWT callbacks produced user IDs and database session IDs; protected pages accepted those sessions. RBAC did not reject valid sign-ins.

The original generic error cannot be attributed to a bad password hash from that snapshot. HOD had one failed attempt, but the old audit entry did not distinguish a missing, expired or already-used OTP from a bad password. Such codes must still fail normally.

Confirmed defects repaired:

- The browser used `127.0.0.1`, while `AUTH_URL` used `localhost`. Auth.js dropped the requested dashboard redirect and protected writes returned `403 INVALID_ORIGIN`. Next.js also normalizes loopback IPs to `localhost` internally, so simply changing `.env` was insufficient for strict production redirects. Redirects now validate against the configured public origin. Development permits only same-protocol, same-port loopback aliases; production stays exact-origin.
- Demo buttons hardcoded a password independently of `DEMO_PASSWORD`. They now receive the actual configured local password from the server, only when local demo mode is explicitly enabled. Production does not render or serialize the demo password.
- Seed upserts used `update: {}`. Reseeding never repaired changed passwords, inactive accounts, lockouts, enabled optional MFA, rotated encryption keys or consumed TOTP state. The bounded local reset now repairs only the nine named synthetic accounts and preserves IDs, achievements and points. It revokes old demo sessions, recovery codes and account links.
- CLI tools loaded only `.env`, whereas Next.js can load higher-priority `.env.local` and mode-specific files. Both now use Next.js environment loading semantics. The OTP CLI reads and decrypts the exact HOD/Admin account secret from the actual database instead of independently generating a code from an environment string. It waits for an unused, sufficiently fresh interval.
- Copying `.env.example` before setup left placeholder secrets unchanged. Local setup now repairs missing/placeholders once while preserving valid existing keys.

No schema change was needed. Committed migrations were applied, demo accounts reset, and four real HTTP Auth.js cookie/session logins were tested at `127.0.0.1:3000`, including role dashboards, protected actions and RBAC. Wrong credentials and missing privileged-role MFA were rejected. Production smoke checks verified Student/Admin sessions and dashboards, absence of demo controls/passwords, and rejection of a different loopback origin.

The shared TOTP configuration is SHA-1, 6 digits, a 30-second period and window `0` (current interval only). Replay prevention, five-attempt/30-minute lockout, account approval, database session revocation and mandatory privileged-role MFA remain in effect.

From the project folder, with the database running:

```sh
npm run demo:reset
npm run dev
# Another terminal, before HOD/Admin login:
npm run demo:otp
# All four roles and negative cases, without launching Chromium:
npm run test:login
```

For a fresh clone/archive, run `npm run setup` then `npm run dev`. The explicit installation/generation/migration/seed commands and exact default credentials are in [README](../README.md).
