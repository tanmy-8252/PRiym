"use client";
import { useActionState, useState } from "react";
import { demoAccounts } from "@/lib/demo";
import Link from "next/link";
import { loginAction } from "@/app/login/actions";
import type { LoginAudience } from "@/components/login-page";
export function LoginForm({
  demoPassword,
  audience,
}: {
  demoPassword?: string;
  audience?: LoginAudience;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [errorDismissed, setErrorDismissed] = useState(false);
  const [state, formAction, busy] = useActionState(loginAction, { error: "" });
  return (
    <>
      <form action={formAction} onSubmit={() => setErrorDismissed(false)}>
        <div className="field">
          <label htmlFor="email">Institutional email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrorDismissed(true);
            }}
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrorDismissed(true);
            }}
          />
        </div>
        <div className="field">
          <label htmlFor="otp">
            Authenticator code{" "}
            <span className="muted">(HOD / Admin, or if enabled)</span>
          </label>
          <input
            id="otp"
            name="otp"
            inputMode="text"
            autoComplete="one-time-code"
            placeholder="6-digit code or recovery code"
            value={otp}
            maxLength={32}
            onChange={(e) => {
              setOtp(e.target.value);
              setErrorDismissed(true);
            }}
          />
        </div>
        <label className="check small">
          <input type="checkbox" name="remember" /> Remember me for 30 days
        </label>
        {state.error && !errorDismissed && (
          <div className="notice error" role="alert">
            {state.error}
          </div>
        )}
        <button className="btn" disabled={busy}>
          {busy ? "Signing in…" : "Sign in →"}
        </button>
      </form>
      <p className="small muted" style={{ marginTop: 22 }}>
        <Link href="/account?mode=register" prefetch={false}>
          Create an account
        </Link>{" "}
        ·{" "}
        <Link href="/account?mode=reset" prefetch={false}>
          Forgot password?
        </Link>{" "}
        ·{" "}
        <Link href="/account?mode=verify" prefetch={false}>
          Verify email
        </Link>
      </p>
      {demoPassword && (
        <div className="notice">
          <strong className="small">Local demo accounts</strong>
          <div className="login-demo">
            {demoAccounts
              .filter(
                (account) =>
                  !audience ||
                  (audience === "STAFF"
                    ? account.role === "HOD" || account.role === "ADMIN"
                    : account.role === audience),
              )
              .map((account) => (
                <button
                  key={account.role}
                  disabled={busy}
                  onClick={() => {
                    setEmail(account.email);
                    setPassword(demoPassword);
                    setOtp("");
                    setErrorDismissed(true);
                  }}
                >
                  {account.label}
                </button>
              ))}
          </div>
          <p className="tiny" style={{ marginTop: 10 }}>
            HOD and Admin require a code from <code>npm run demo:otp</code>.
            Demo documents are synthetic.
          </p>
        </div>
      )}
      <Link
        href="/login"
        prefetch={false}
        className="tiny muted"
        style={{ display: "block", marginTop: 22 }}
      >
        Protected access · Institution verified
      </Link>
    </>
  );
}
