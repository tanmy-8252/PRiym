"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "./admin-forms";
import { parseCsv } from "@/lib/csv-import";
type Field = {
  name: string;
  label: string;
  type?: string;
  value?: string | number;
  required?: boolean;
  options?: { id: string; name: string }[];
};
export function InstitutionForm({
  action,
  fields,
  button,
  id,
}: {
  action: string;
  fields: Field[];
  button: string;
  id?: string;
}) {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setBusy(true);
        try {
          const data: Record<string, unknown> = { action, id };
          for (const field of fields)
            data[field.name] =
              field.type === "checkbox"
                ? f.get(field.name) === "on"
                : f.get(field.name) || undefined;
          await mutate("/api/v1/admin/configuration", "POST", data);
          setMessage("Saved.");
          router.refresh();
        } catch (e) {
          setMessage((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="form-grid">
        {fields.map((f) => (
          <div className="field" key={f.name}>
            <label htmlFor={`${action}-${id || "new"}-${f.name}`}>
              {f.label}
            </label>
            {f.options ? (
              <select
                id={`${action}-${id || "new"}-${f.name}`}
                name={f.name}
                defaultValue={f.value}
              >
                {f.options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={`${action}-${id || "new"}-${f.name}`}
                name={f.name}
                type={f.type || "text"}
                defaultValue={f.type === "checkbox" ? undefined : f.value}
                required={f.required ?? true}
              />
            )}
          </div>
        ))}
      </div>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      <button
        className="btn secondary"
        style={{ marginTop: 18 }}
        disabled={busy}
      >
        {button}
      </button>
    </form>
  );
}
export function BulkImport() {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const text = String(new FormData(e.currentTarget).get("csv"));
        setBusy(true);
        try {
          const r = await mutate("/api/v1/admin/import", "POST", {
            rows: parseCsv(text),
          });
          setMessage(
            r.results
              .map(
                (x: { row: number; ok: boolean; error?: string }) =>
                  `Row ${x.row}: ${x.ok ? "created — verification email queued" : x.error}`,
              )
              .join("\n"),
          );
        } catch (e) {
          setMessage((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="small muted">
        Paste up to 200 CSV accounts. Required headers:
        name,email,password,departmentId,role. Students also need usn and
        batchYear. HOD/Admin need mfaSecret. Each result is reported separately.
      </p>
      <div className="field">
        <label htmlFor="csv-users">Account CSV</label>
        <textarea id="csv-users" name="csv" required rows={6} />
      </div>
      <button className="btn secondary" disabled={busy}>
        Import accounts
      </button>
      {message && (
        <pre
          className="notice"
          style={{ whiteSpace: "pre-wrap" }}
          role="status"
        >
          {message}
        </pre>
      )}
    </form>
  );
}
export function BadgeControls({
  badges,
  students,
  categories,
}: {
  badges: {
    id: string;
    name: string;
    description: string;
    threshold: number;
    ruleType: string;
    active: boolean;
    categoryId: string | null;
  }[];
  students: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}) {
  const [message, setMessage] = useState("");
  const router = useRouter();
  const send = async (url: string, d: unknown) => {
    try {
      await mutate(url, "PATCH", d);
      setMessage("Recognition updated.");
      router.refresh();
    } catch (e) {
      setMessage((e as Error).message);
    }
  };
  return (
    <>
      <div className="stack">
        {badges.map((b) => (
          <form
            key={b.id}
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void send("/api/v1/admin/badges", {
                id: b.id,
                name: f.get("name"),
                description: f.get("description"),
                threshold: Number(f.get("threshold")),
                ruleType: f.get("ruleType"),
                categoryId: f.get("categoryId") || null,
                active: f.get("active") === "on",
              });
            }}
          >
            <div className="form-grid">
              <div className="field">
                <label>
                  Badge name
                  <input name="name" defaultValue={b.name} required />
                </label>
              </div>
              <div className="field">
                <label>
                  Description
                  <input
                    name="description"
                    defaultValue={b.description}
                    required
                    minLength={10}
                  />
                </label>
              </div>
              <div className="field">
                <label>
                  Rule
                  <select name="ruleType" defaultValue={b.ruleType}>
                    {[
                      "MILESTONE",
                      "ACHIEVEMENT",
                      "ACTIVITY",
                      "STREAK",
                      "SEMESTER",
                    ].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="field">
                <label>
                  Threshold (points / count / consecutive semesters)
                  <input
                    name="threshold"
                    type="number"
                    defaultValue={b.threshold}
                    min={0}
                    required
                  />
                </label>
              </div>
              <div className="field">
                <label>
                  Category filter
                  <select name="categoryId" defaultValue={b.categoryId || ""}>
                    <option value="">All categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="check small">
                <input
                  name="active"
                  type="checkbox"
                  defaultChecked={b.active}
                />
                Active
              </label>
            </div>
            <button className="btn secondary" style={{ marginTop: 10 }}>
              Save badge rule
            </button>
          </form>
        ))}
      </div>
      <form
        style={{ marginTop: 30 }}
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          void send("/api/v1/admin/badges", {
            action: "REVOKE",
            badgeId: f.get("badgeId"),
            userId: f.get("userId"),
            reason: f.get("reason"),
          });
        }}
      >
        <h3>Revoke an awarded badge</h3>
        <div className="form-grid">
          <div className="field">
            <label>
              Student
              <select name="userId">
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="field">
            <label>
              Badge
              <select name="badgeId">
                {badges.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="field full">
            <label>
              Reason
              <textarea name="reason" minLength={20} required />
            </label>
          </div>
        </div>
        <button className="btn secondary" style={{ marginTop: 15 }}>
          Record revocation
        </button>
      </form>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
    </>
  );
}
