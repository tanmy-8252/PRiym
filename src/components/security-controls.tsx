"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "./admin-forms";
export function MfaControls({
  enabled,
  required,
}: {
  enabled: boolean;
  required: boolean;
}) {
  const [message, setMessage] = useState(""),
    [secret, setSecret] = useState(""),
    [codes, setCodes] = useState<string[]>([]),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const f = new FormData(e.currentTarget);
        const action = (e.nativeEvent as SubmitEvent).submitter?.getAttribute(
          "value",
        );
        try {
          const r = await mutate("/api/v1/mfa", "POST", {
            action,
            password: f.get("password"),
            otp: f.get("otp"),
          });
          if (r.secret) {
            setSecret(r.secret);
            setMessage(
              "Add the secret to your authenticator, then confirm a code.",
            );
          } else {
            setCodes(r.recoveryCodes || []);
            setMessage(
              "MFA updated. Save recovery codes somewhere private; each works once.",
            );
            router.refresh();
          }
        } catch (e) {
          setMessage((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="small muted">
        {enabled
          ? "Authenticator enabled."
          : "Add an authenticator to protect your account."}
        {required ? " MFA is required for your role." : ""}
      </p>
      <div className="field">
        <label htmlFor="mfa-password">Current password</label>
        <input
          id="mfa-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>
      {secret && (
        <div className="notice">
          <strong>Setup secret</strong>
          <p style={{ overflowWrap: "anywhere" }}>{secret}</p>
        </div>
      )}
      <div className="field">
        <label htmlFor="mfa-otp">Authenticator code</label>
        <input
          id="mfa-otp"
          name="otp"
          autoComplete="one-time-code"
          maxLength={6}
        />
      </div>
      <div className="form-actions">
        {!enabled && (
          <button
            className="btn secondary"
            name="action"
            value={secret ? "CONFIRM" : "BEGIN"}
            disabled={busy}
          >
            {secret ? "Confirm authenticator" : "Start MFA setup"}
          </button>
        )}
        {enabled && (
          <>
            <button
              className="btn secondary"
              name="action"
              value="RECOVERY"
              disabled={busy}
            >
              Generate recovery codes
            </button>
            {!required && (
              <button
                className="btn ghost"
                name="action"
                value="DISABLE"
                disabled={busy}
              >
                Disable MFA
              </button>
            )}
          </>
        )}
      </div>
      {message && (
        <div className="notice" role="status">
          {message}
        </div>
      )}
      {codes.length > 0 && (
        <pre style={{ whiteSpace: "pre-wrap" }}>{codes.join("\n")}</pre>
      )}
    </form>
  );
}
export function SessionRevoke({ id }: { id: string }) {
  const router = useRouter(),
    [message, setMessage] = useState("");
  return (
    <>
      <button
        className="btn ghost"
        onClick={async () => {
          try {
            await mutate("/api/v1/session", "PATCH", { id });
            router.refresh();
          } catch (e) {
            setMessage((e as Error).message);
          }
        }}
      >
        Revoke
      </button>
      {message && <p role="alert">{message}</p>}
    </>
  );
}
export function InactivityWarning() {
  const [warning, setWarning] = useState(false);
  // User activity resets the local timer; only genuine activity sends a keep-alive.
  useActivity(setWarning);
  return warning ? (
    <div
      className="notice"
      role="alert"
      style={{ position: "fixed", bottom: 20, right: 20, zIndex: 100 }}
    >
      Your session will expire in five minutes.{" "}
      <button
        className="btn secondary"
        onClick={() => window.dispatchEvent(new Event("pointerdown"))}
      >
        Stay signed in
      </button>
    </div>
  ) : null;
}
import { useEffect } from "react";
function useActivity(setWarning: (v: boolean) => void) {
  const router = useRouter();
  useEffect(() => {
    let last = Date.now(),
      ping = 0;
    const activity = () => {
      last = Date.now();
      setWarning(false);
      if (last - ping > 60000) {
        ping = last;
        void fetch("/api/v1/session");
      }
    };
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - last;
      if (elapsed >= 30 * 60000) {
        router.push("/login");
      } else setWarning(elapsed >= 25 * 60000);
    }, 10000);
    window.addEventListener("pointerdown", activity);
    window.addEventListener("keydown", activity);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("pointerdown", activity);
      window.removeEventListener("keydown", activity);
    };
  }, [setWarning, router]);
}
