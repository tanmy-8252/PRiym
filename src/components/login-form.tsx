"use client";
import { useState } from "react";
import { demoAccounts } from "@/lib/demo";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
export function LoginForm({ demoPassword }: { demoPassword?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const f = new FormData(e.currentTarget);
          try {
            const r = await signIn("credentials", {
              email,
              password,
              otp,
              remember: f.get("remember") === "on" ? "true" : "false",
              redirect: false,
              redirectTo: "/dashboard",
            });
            if (r?.error) {
              setError(
                "Unable to sign in. Check your credentials and MFA code, account approval, or wait 30 minutes if locked.",
              );
            } else {
              router.push("/dashboard");
              router.refresh();
            }
          } catch {
            setError("Sign-in is temporarily unavailable. Try again.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="field">
          <label htmlFor="email">Institutional email</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="otp">
            Authenticator code{" "}
            <span className="muted">(HOD / Admin, or if enabled)</span>
          </label>
          <input
            id="otp"
            inputMode="text"
            autoComplete="one-time-code"
            placeholder="6-digit code or recovery code"
            value={otp}
            maxLength={32}
            onChange={(e) => setOtp(e.target.value)}
          />
        </div>
        <label className="check small">
          <input type="checkbox" name="remember" /> Remember me for 30 days
        </label>
        {error && (
          <div className="notice error" role="alert">
            {error}
          </div>
        )}
        <button className="btn" disabled={busy}>
          {busy ? "Signing in…" : "Sign in →"}
        </button>
      </form>
      <p className="small muted" style={{ marginTop: 22 }}>
        <Link href="/account?mode=register">Create an account</Link> ·{" "}
        <Link href="/account?mode=reset">Forgot password?</Link> ·{" "}
        <Link href="/account?mode=verify">Verify email</Link>
      </p>
      {demoPassword && (
        <div className="notice">
          <strong className="small">Local demo accounts</strong>
          <div className="login-demo">
            {demoAccounts.map((account) => (
              <button
                key={account.role}
                disabled={busy}
                onClick={() => {
                  setEmail(account.email);
                  setPassword(demoPassword);
                  setError("");
                  setOtp("");
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
        className="tiny muted"
        style={{ display: "block", marginTop: 22 }}
      >
        Protected access · Institution verified
      </Link>
    </>
  );
}
