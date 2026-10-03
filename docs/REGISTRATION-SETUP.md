# Open production registration

Use the primary production domain from Vercel Domains, with exactly that origin
in `AUTH_URL`. Generated Production deployment page links redirect to that
domain. Preview databases and secrets must be separate from Production.

## 1. Gmail sending account

Sign in to the Gmail account that will send PRiym messages. Enable Google
2-Step Verification, then open [App passwords](https://myaccount.google.com/apppasswords).
Create an app password named **PRiym**. Keep the generated password private;
remove its display spaces when entering it in Vercel. Use an app password, never
your normal Google password. App passwords may be unavailable for managed or
Advanced Protection accounts. If unavailable, use an approved sending provider.

In Vercel → PRiym → Settings → Environment Variables, add the following for
**Production only**. Keep the password marked Secret.

| Variable         | Value                                           |
| ---------------- | ----------------------------------------------- |
| `EMAIL_PROVIDER` | `smtp`                                          |
| `EMAIL_FROM`     | Your full Gmail address                         |
| `SMTP_HOST`      | `smtp.gmail.com`                                |
| `SMTP_PORT`      | `465`                                           |
| `SMTP_USER`      | The same full Gmail address                     |
| `SMTP_PASSWORD`  | The private Google app password, without spaces |

Keep `AUTH_SECRET`, `AUDIT_SECRET` and `CRON_SECRET` unchanged. Set `AUTH_URL`
to your HTTPS primary domain, `INSTITUTION_DOMAINS=atria.edu,atria.edu.in`,
`SEED_DEMO=false` and `NEXT_PUBLIC_DEMO_MODE=false`.

Gmail is a pilot option: account sending quotas and automated-login restrictions
can interrupt delivery. Move to a verified domain and a transactional provider
before scaling. See [Nodemailer’s Gmail guide](https://nodemailer.com/guides/using-gmail)
and [Google’s app-password guide](https://support.google.com/accounts/answer/185833).

## 2. Create the initial Admin and CSE through Vercel

Run the following on your trusted local computer inside the project:

```sh
npm ci
npm run mfa:enroll
```

The enrollment command prints a private base32 secret. Add it manually to an
authenticator (issuer PRiym, account your Admin email, time based, SHA-1,
6 digits, 30 seconds). Enter the current code locally to confirm enrollment.
Do not share that secret or a screenshot of it. Keep your authenticator entry.

Privately add these **Production-only Secret** variables in Vercel:

| Variable                     | Value                                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| `BOOTSTRAP_ADMIN_ENABLED`    | `true`                                                                                        |
| `BOOTSTRAP_ADMIN_EMAIL`      | The chosen initial Admin email                                                                |
| `BOOTSTRAP_ADMIN_NAME`       | The Admin’s full name                                                                         |
| `BOOTSTRAP_ADMIN_PASSWORD`   | A new unique PRiym password: 8–72 characters, uppercase, lowercase, number, special character |
| `BOOTSTRAP_ADMIN_MFA_SECRET` | The secret you just enrolled and confirmed                                                    |

The initial Admin email may be a Gmail address. Normal Student/Faculty signup
still requires an approved institutional domain. These bootstrap settings are
privileged account-creation instructions, so only the project owner should set
them. They never use a `NEXT_PUBLIC_` prefix.

Redeploy the latest `main` commit. The build generates Prisma, applies migrations,
and, only when explicitly enabled for Vercel Production, creates the first
Admin and CSE. Passwords use bcrypt; MFA is encrypted with the **existing**
production `AUTH_SECRET`. An audit entry records provisioning. No demo users
are inserted. Existing Admins are never overwritten; if the requested Admin
already exists, the build leaves it unchanged. A different existing Admin or
conflicting existing account prevents provisioning.

After the deployment is Ready, sign in at the primary `/login` using your
Admin email, chosen PRiym password and the current authenticator code. Open
Admin/Institution and confirm CSE exists. **Delete all five `BOOTSTRAP_ADMIN_*`
variables from Vercel immediately, then redeploy.** The database account remains.
Do not rotate `AUTH_SECRET`: encrypted MFA depends on it.

If deployment fails at initial Admin setup, read the final build-log line. It
names an invalid `BOOTSTRAP_ADMIN_*` field or a database conflict without printing
private values. `BOOTSTRAP_ADMIN_MFA_SECRET` needs the full setup key, not a
six-digit code. Correct the indicated Secret privately in Vercel and redeploy;
bootstrap does not overwrite existing administrator credentials.

## 3. Verify real registration and email

Open the primary `/account?mode=register`. Choose Student or Faculty and CSE.
Use an institutional address you can read; Students need a valid USN and a
strong unique password. Submit the form. The account is saved as `PENDING` and
unverified, and its single-use verification email is queued in the same database
transaction. Delivery is attempted immediately after the response.

Check inbox/spam, open the link and click Verify email. In a separate Admin
session, open Admin, find the verified account, and Approve & activate. Only
then can it sign in. HOD/Admin accounts are provisioned through administration
and require MFA; they cannot select a privileged role at public signup.

If mail is missing, check Vercel runtime logs and the `MailOutbox` table’s
`status`, `attempts` and `lastError`. Do not publish message bodies: they contain
private verification/reset links. Google app passwords are revoked after a
Google password change. Update the private Vercel setting and redeploy if needed.
Request a new verification link from `/account?mode=verify` after 60 seconds.

The included Vercel cron retries due email at 06:00 UTC daily (Hobby compatible).
This is a fallback; normal account mail does not wait for it. For frequent
retries, configure an authorized scheduler to call `GET /api/mail/maintenance`
with `Authorization: Bearer <CRON_SECRET>` every few minutes, or run the worker
on a persistent host. The endpoint is private and does not run filesystem report
jobs. Do not put its secret in a URL or public repository.

## Optional trusted-machine provisioning

This alternative requires access to the **exact existing** database, `AUTH_SECRET`
and `AUDIT_SECRET` used in Production. Do not substitute local demo secrets.

```sh
npm ci
npm run db:generate
cp docs/production.env.example .env.operator
chmod 600 .env.operator
# Fill the private file; never paste its values into chat or commit it.
npm run production:bootstrap
npm run production:check
```

The interactive bootstrap confirms the hosted destination, privately prompts
for a password, enrolls and verifies MFA, and atomically creates the first Admin
and CSE. It refuses additional Admins. The check reads database setup and tests
SMTP TLS/authentication without sending email; actual inbox delivery must still
be tested with your own registration. Neither command falls back to the local
demo `.env`. Keep the private file protected or remove it after use. Migrations
are applied by the Vercel deployment before provisioning; never run `db:seed`
against Production.
