"use client";
import { useState } from "react";
import Link from "next/link";
import { mutate } from "./admin-forms";
export function AccountForm({
  mode,
  token,
  departments,
}: {
  mode: string;
  token?: string;
  departments: { id: string; name: string }[];
}) {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const register = mode === "register",
    consume = !!token;
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const f = new FormData(e.currentTarget);
        try {
          const result = await mutate(
            "/api/account",
            "POST",
            register
              ? {
                  action: "REGISTER",
                  name: f.get("name"),
                  email: f.get("email"),
                  password: f.get("password"),
                  departmentId: f.get("departmentId"),
                  role: f.get("role"),
                  usn: f.get("usn") || undefined,
                  batchYear: Number(f.get("batchYear")) || undefined,
                }
              : consume
                ? {
                    token,
                    purpose: mode === "verify" ? "VERIFY" : "RESET",
                    password: f.get("password") || undefined,
                  }
                : {
                    action: "LINK",
                    email: f.get("email"),
                    purpose: mode === "verify" ? "VERIFY" : "RESET",
                  },
          );
          setMessage(result.message);
        } catch (e) {
          setMessage((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {register && (
        <>
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              name="name"
              required
              minLength={2}
              maxLength={100}
            />
          </div>
          <div className="field">
            <label htmlFor="role">Role</label>
            <select id="role" name="role">
              <option value="STUDENT">Student</option>
              <option value="FACULTY">Faculty</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="departmentId">Department</label>
            <select id="departmentId" name="departmentId" required>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="usn">USN (required for students)</label>
            <input id="usn" name="usn" placeholder="1AT22CS001" />
          </div>
          <div className="field">
            <label htmlFor="batchYear">Batch year</label>
            <input
              id="batchYear"
              name="batchYear"
              type="number"
              min={2000}
              max={2100}
            />
          </div>
        </>
      )}
      {!consume && (
        <div className="field">
          <label htmlFor="email">Institutional email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
      )}
      {(register || (consume && mode === "reset")) && (
        <>
          <div className="field">
            <label htmlFor="password">
              {register ? "Password" : "New password"}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
            />
          </div>
          <p className="tiny muted">
            Use uppercase, lowercase, a number and a special character.
          </p>
        </>
      )}
      {message && (
        <div className="notice" role="status">
          {message}
        </div>
      )}
      <button className="btn" disabled={busy}>
        {busy
          ? "Please wait…"
          : register
            ? "Create account"
            : consume
              ? mode === "verify"
                ? "Verify email"
                : "Reset password"
              : "Send email link"}
      </button>
      <p style={{ marginTop: 20 }}>
        <Link href="/login">Back to sign in</Link>
      </p>
    </form>
  );
}
