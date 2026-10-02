"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "./admin-forms";
export function PointAdjustment({
  students,
}: {
  students: { id: string; name: string }[];
}) {
  const [message, setMessage] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        if (
          !confirm(
            "Record this manual points adjustment? It will be permanently logged.",
          )
        )
          return;
        try {
          await mutate("/api/v1/points", "POST", {
            userId: f.get("userId"),
            amount: Number(f.get("amount")),
            reason: f.get("reason"),
          });
          setMessage("Points adjustment recorded.");
        } catch (e) {
          setMessage((e as Error).message);
        }
      }}
    >
      <div className="form-grid">
        <div className="field">
          <label>Student</label>
          <select
            name="userId"
            aria-label="Student for points adjustment"
            required
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Adjustment amount</label>
          <input
            name="amount"
            aria-label="Adjustment amount"
            type="number"
            min={-1000}
            max={1000}
            required
          />
        </div>
        <div className="field full">
          <label>Reason (at least 20 characters)</label>
          <textarea
            name="reason"
            aria-label="Points adjustment reason"
            required
            minLength={20}
          />
        </div>
      </div>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      <button className="btn secondary" style={{ marginTop: 20 }}>
        Record adjustment
      </button>
    </form>
  );
}
export function DepartmentSettings({
  slaDays,
  categories,
}: {
  slaDays: number;
  categories: { id: string; name: string; multiplier: number }[];
}) {
  const [message, setMessage] = useState("");
  const router = useRouter();
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        try {
          await mutate("/api/v1/department", "PATCH", {
            slaDays: Number(f.get("slaDays")),
            weights: categories.map((c) => ({
              id: c.id,
              multiplier: Number(f.get(c.id)),
            })),
          });
          setMessage(
            "Department settings updated for future awards and assignments.",
          );
          router.refresh();
        } catch (e) {
          setMessage((e as Error).message);
        }
      }}
    >
      <div className="form-grid">
        <div className="field">
          <label>Review SLA (business days)</label>
          <input
            aria-label="Review SLA"
            name="slaDays"
            type="number"
            min={1}
            max={30}
            defaultValue={slaDays}
          />
        </div>
        {categories.map((c) => (
          <div className="field" key={c.id}>
            <label>{c.name} weight</label>
            <input
              aria-label={`${c.name} weight`}
              name={c.id}
              type="number"
              min={0.1}
              max={5}
              step={0.1}
              defaultValue={c.multiplier}
            />
          </div>
        ))}
      </div>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      <button className="btn" style={{ marginTop: 20 }}>
        Save department settings
      </button>
    </form>
  );
}
export function BadgeForm() {
  const [message, setMessage] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        try {
          await mutate("/api/v1/admin/badges", "POST", {
            name: f.get("name"),
            description: f.get("description"),
            threshold: Number(f.get("threshold")),
          });
          setMessage(
            "Badge created. Evaluated on the next point award or adjustment.",
          );
        } catch (e) {
          setMessage((e as Error).message);
        }
      }}
    >
      <div className="form-grid">
        <div className="field">
          <label>Name</label>
          <input aria-label="Badge name" name="name" required />
        </div>
        <div className="field">
          <label>Point threshold</label>
          <input
            aria-label="Badge point threshold"
            name="threshold"
            type="number"
            min={0}
            required
          />
        </div>
        <div className="field full">
          <label>Description</label>
          <input
            aria-label="Badge description"
            name="description"
            required
            minLength={10}
          />
        </div>
      </div>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      <button className="btn secondary" style={{ marginTop: 20 }}>
        Create milestone badge
      </button>
    </form>
  );
}
