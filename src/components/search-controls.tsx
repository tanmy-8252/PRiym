"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { mutate } from "./admin-forms";
type Result = {
  students: { id: string; name: string; usn: string | null }[];
  faculty: { id: string; name: string }[];
  submissions: { id: string; title: string }[];
};
export function GlobalSearch() {
  const [q, setQ] = useState(""),
    [result, setResult] = useState<Result | null>(null);
  useEffect(() => {
    if (q.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/v1/search?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      })
        .then((r) => r.json())
        .then((b) => setResult(b.data))
        .catch(() => {});
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);
  return (
    <div style={{ position: "relative", maxWidth: 340 }}>
      <input
        aria-label="Search students and achievements"
        placeholder="Search students, achievements…"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setResult(null);
        }}
      />
      {result && q.length >= 2 && (
        <div
          className="card"
          style={{
            position: "absolute",
            top: 45,
            zIndex: 20,
            width: 340,
            maxHeight: 420,
            overflowY: "auto",
          }}
        >
          <button
            className="btn ghost"
            onClick={() => {
              setQ("");
              setResult(null);
            }}
          >
            Close
          </button>
          <strong>Students</strong>
          {result.students.map((s) => (
            <p key={s.id}>
              <Link href={`/students/${s.id}`} onClick={() => setQ("")}>
                {s.name} · {s.usn}
              </Link>
            </p>
          ))}
          <strong>Faculty</strong>
          {result.faculty.map((f) => (
            <p key={f.id}>{f.name}</p>
          ))}
          <strong>Achievements</strong>
          {result.submissions.map((s) => (
            <p key={s.id}>
              <Link href={`/submissions/${s.id}`} onClick={() => setQ("")}>
                {s.title}
              </Link>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
export function SaveFilter({ query }: { query: string }) {
  const [message, setMessage] = useState("");
  const router = useRouter();
  return (
    <form
      className="filters"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await mutate("/api/v1/filters", "POST", {
            label: new FormData(e.currentTarget).get("label"),
            query,
          });
          setMessage("Filter saved.");
          router.refresh();
        } catch (e) {
          setMessage((e as Error).message);
        }
      }}
    >
      <input
        name="label"
        aria-label="Saved filter label"
        placeholder="Name this filter"
        required
        minLength={2}
        maxLength={60}
      />
      <button className="btn ghost">Save current filters</button>
      {message && <span role="status">{message}</span>}
    </form>
  );
}
export function BatchClarify({
  rows,
}: {
  rows: { id: string; title: string; version: number }[];
}) {
  const [message, setMessage] = useState("");
  const router = useRouter();
  return (
    <details style={{ marginTop: 20 }}>
      <summary>Request clarification for several achievements</summary>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          try {
            const ids = f.getAll("ids");
            const r = await mutate("/api/v1/submissions/batch", "POST", {
              items: rows
                .filter((s) => ids.includes(s.id))
                .map((s) => ({ id: s.id, version: s.version })),
              comment: f.get("comment"),
            });
            setMessage(
              r.results
                .map((x: { ok: boolean; error?: string }) =>
                  x.ok ? "Clarification requested" : x.error,
                )
                .join(" · "),
            );
            router.refresh();
          } catch (e) {
            setMessage((e as Error).message);
          }
        }}
      >
        {rows.map((s) => (
          <label className="check small" key={s.id}>
            <input type="checkbox" name="ids" value={s.id} />
            {s.title}
          </label>
        ))}
        <div className="field">
          <label>
            Clarification needed (10+ characters)
            <textarea name="comment" minLength={10} maxLength={2000} required />
          </label>
        </div>
        <button className="btn secondary">
          Request clarification for selected items
        </button>
        {message && (
          <p className="notice" role="status">
            {message}
          </p>
        )}
      </form>
    </details>
  );
}
