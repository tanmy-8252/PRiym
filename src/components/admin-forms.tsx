"use client";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
export async function mutate(url: string, method: string, payload: unknown) {
  const r = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const b = await r.json();
  if (!r.ok) throw new Error(b.error.message);
  return b.data;
}
export function AccountActions({
  id,
  name,
  email,
  usn,
  status,
  role,
  mentorId,
  faculty,
}: {
  id: string;
  name: string;
  email: string;
  usn: string | null;
  status: string;
  role: string;
  mentorId: string | null;
  faculty: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmRemoval, setConfirmRemoval] = useState(false);
  async function update(payload: unknown) {
    setBusy(true);
    setError("");
    try {
      await mutate(`/api/v1/admin/users/${id}`, "PATCH", payload);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function removeRequest() {
    setBusy(true);
    setError("");
    try {
      await mutate(`/api/v1/admin/users/${id}`, "DELETE", { email, status });
      setConfirmRemoval(false);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button
          className="btn secondary"
          disabled={busy}
          onClick={() =>
            void update({ status: status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })
          }
        >
          {status === "ACTIVE"
            ? "Deactivate"
            : status === "INACTIVE"
              ? "Reactivate"
              : "Approve & activate"}
        </button>
        {(status === "INACTIVE" ||
          (status === "PENDING" && ["STUDENT", "FACULTY"].includes(role))) && (
          <button
            className="btn secondary"
            style={{ color: "#a15445", borderColor: "#dfb4ae" }}
            disabled={busy}
            onClick={() => {
              setError("");
              setConfirmRemoval(true);
            }}
          >
            {status === "INACTIVE" ? "Remove account" : "Remove request"}
          </button>
        )}
        <select
          aria-label="Account role"
          className="filter-input"
          value={role}
          disabled={busy}
          onChange={(e) => void update({ role: e.target.value })}
        >
          {["STUDENT", "FACULTY", "HOD", "ADMIN"].map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        {role === "STUDENT" && (
          <select
            className="filter-input"
            aria-label="Faculty mentor"
            value={mentorId ?? ""}
            disabled={busy}
            onChange={(e) => void update({ mentorId: e.target.value || null })}
          >
            <option value="">No mentor</option>
            {faculty.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        )}
      </div>
      {confirmRemoval && (
        <RemovalConfirmation
          name={name}
          email={email}
          usn={usn}
          deactivated={status === "INACTIVE"}
          busy={busy}
          error={error}
          onCancel={() => setConfirmRemoval(false)}
          onConfirm={() => void removeRequest()}
        />
      )}
      {error && !confirmRemoval && (
        <p
          className="small"
          role="alert"
          style={{ color: "#a15445", marginTop: 8 }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
function RemovalConfirmation({
  name,
  email,
  usn,
  deactivated,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  name: string;
  email: string;
  usn: string | null;
  deactivated: boolean;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const dialog = dialogRef.current!;
    dialog.showModal();
    cancelRef.current?.focus();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={dialogRef}
      className="removal-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h2 id={titleId}>
        {deactivated
          ? "Remove deactivated account?"
          : "Remove registration request?"}
      </h2>
      <div
        className="notice"
        style={{ margin: "18px 0", overflowWrap: "anywhere" }}
      >
        <strong>{name}</strong>
        <p>{email}</p>
        {usn && <p>{usn}</p>}
      </div>
      <p id={descriptionId} className="small muted">
        {deactivated
          ? "This permanently removes login access and the account from this panel. Achievements, points, reviews and audit history are retained. Open assigned reviews go to the HOD for reassignment."
          : "This permanently removes the pending request and its verification links."}{" "}
        The email and USN can then be used for a corrected registration. This
        cannot be undone.
      </p>
      {error && (
        <p
          role="alert"
          className="small"
          style={{ color: "#a15445", marginTop: 12 }}
        >
          {error}
        </p>
      )}
      <div
        className="form-actions"
        style={{ justifyContent: "flex-end", marginTop: 22 }}
      >
        <button
          ref={cancelRef}
          className="btn secondary"
          disabled={busy}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="btn"
          style={{ background: "#a15445" }}
          disabled={busy}
          onClick={onConfirm}
        >
          {busy ? "Removing…" : "Remove permanently"}
        </button>
      </div>
    </dialog>
  );
}
export function CreateUserForm({
  departments,
}: {
  departments: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const f = new FormData(form);
        const d = Object.fromEntries(f);
        setBusy(true);
        try {
          await mutate("/api/v1/admin/users", "POST", {
            ...d,
            batchYear: d.batchYear ? Number(d.batchYear) : undefined,
            usn: d.usn || undefined,
            mfaSecret: d.mfaSecret || undefined,
          });
          form.reset();
          setMessage(
            "Account created in pending approval. Verify the account owner, then activate it below.",
          );
          router.refresh();
        } catch (e) {
          setMessage((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="form-grid">
        {[
          ["name", "Full name", "text"],
          ["email", "Institutional email", "email"],
          ["password", "Initial password", "password"],
          ["usn", "USN (students)", "text"],
          ["batchYear", "Batch year (students)", "number"],
        ].map(([name, title, type]) => (
          <div className="field" key={name}>
            <label htmlFor={`user-${name}`}>{title}</label>
            <input
              id={`user-${name}`}
              name={name}
              type={type}
              required={["name", "email", "password"].includes(name)}
              autoComplete="off"
            />
          </div>
        ))}
        <div className="field">
          <label htmlFor="user-role">Role</label>
          <select name="role" id="user-role">
            {["STUDENT", "FACULTY", "HOD", "ADMIN"].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="user-department">Department</label>
          <select name="departmentId" id="user-department">
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="user-mfa">Authenticator secret (HOD/Admin)</label>
          <input
            id="user-mfa"
            name="mfaSecret"
            placeholder="Base32 secret, provision securely"
            autoComplete="off"
          />
        </div>
      </div>
      <p className="tiny muted" style={{ marginTop: 15 }}>
        Password: 8–72 characters, uppercase, lowercase, number and special
        character. Provision HOD/Admin authenticator secrets directly with the
        account owner.
      </p>
      {message && (
        <div className="notice" role="status">
          {message}
        </div>
      )}
      <div className="form-actions">
        <button className="btn" disabled={busy}>
          Create pending account
        </button>
      </div>
    </form>
  );
}
type CategoryInput = {
  subcategories?: string[];
  programOutcomes?: string[];
  naacIndicator?: string;
  rejectionCodes?: string[];
  id?: string;
  name: string;
  description: string;
  basePoints: number;
  multiplier: number;
  checklist: string[];
  requiresPosition: boolean;
  active: boolean;
};
export function CategoryForm({ initial }: { initial?: CategoryInput }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setBusy(true);
        try {
          await mutate(
            initial
              ? `/api/v1/admin/categories/${initial.id}`
              : "/api/v1/admin/categories",
            initial ? "PATCH" : "POST",
            {
              subcategories: String(f.get("subcategories") || "")
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean),
              programOutcomes: String(f.get("programOutcomes") || "")
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean),
              rejectionCodes: String(f.get("rejectionCodes") || "")
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean),
              naacIndicator: f.get("naacIndicator") || "",
              name: f.get("name"),
              description: f.get("description"),
              basePoints: Number(f.get("basePoints")),
              multiplier: Number(f.get("multiplier")),
              checklist: String(f.get("checklist"))
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean),
              requiresPosition: f.get("requiresPosition") === "on",
              active: f.get("active") === "on",
            },
          );
          setMessage(
            "Category saved. Previously awarded points stay the same.",
          );
          router.refresh();
        } catch (e) {
          setMessage((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="form-grid">
        <div className="field">
          <label>Category name</label>
          <input
            aria-label="Category name"
            name="name"
            required
            defaultValue={initial?.name}
          />
        </div>
        <div className="field">
          <label>Base points</label>
          <input
            aria-label="Base points"
            name="basePoints"
            type="number"
            min={1}
            max={1000}
            defaultValue={initial?.basePoints ?? 50}
            required
          />
        </div>
        <div className="field">
          <label>Department weight</label>
          <input
            aria-label="Department weight"
            name="multiplier"
            type="number"
            step="0.1"
            min={0.1}
            max={5}
            defaultValue={initial?.multiplier ?? 1}
            required
          />
        </div>
        <div className="field">
          <label>Description</label>
          <input
            aria-label="Category description"
            name="description"
            defaultValue={initial?.description}
          />
        </div>
        <div className="field full">
          <label>Verification checklist (one item per line)</label>
          <textarea
            aria-label="Verification checklist"
            name="checklist"
            defaultValue={
              initial?.checklist.join("\n") ??
              "Evidence is authentic and readable\nStudent identity and date match"
            }
            required
          />
        </div>
      </div>
      <div className="form-grid">
        {(["subcategories", "programOutcomes", "rejectionCodes"] as const).map(
          (key) => (
            <div className="field" key={key}>
              <label>
                {key === "subcategories"
                  ? "Subcategories"
                  : key === "programOutcomes"
                    ? "Institution-approved program outcomes"
                    : "Rejection codes"}{" "}
                (one per line)
                <textarea
                  name={key}
                  defaultValue={initial?.[key]?.join("\n")}
                />
              </label>
            </div>
          ),
        )}
        <div className="field">
          <label>
            Institution-approved NAAC indicator
            <input name="naacIndicator" defaultValue={initial?.naacIndicator} />
          </label>
        </div>
      </div>
      <label className="check small">
        <input
          type="checkbox"
          name="requiresPosition"
          defaultChecked={initial?.requiresPosition}
        />{" "}
        Require competition result
      </label>
      <label className="check small">
        <input
          type="checkbox"
          name="active"
          defaultChecked={initial?.active ?? true}
        />{" "}
        Active category
      </label>
      {message && (
        <div className="notice" role="status">
          {message}
        </div>
      )}
      <button className="btn" disabled={busy}>
        {initial ? "Save category" : "Create category"}
      </button>
    </form>
  );
}
