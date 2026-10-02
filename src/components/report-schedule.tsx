"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "./admin-forms";
export function ReportScheduleForm() {
  const [message, setMessage] = useState("");
  const router = useRouter();
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        try {
          await mutate("/api/v1/reports/schedules", "POST", {
            query: new URLSearchParams({
              type: String(f.get("type")),
              format: String(f.get("format")),
              status: "APPROVED",
            }).toString(),
            frequency: f.get("frequency"),
            recipients: String(f.get("recipients") || "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          });
          setMessage(
            "Schedule saved. The worker will email an authorized download link.",
          );
          router.refresh();
        } catch (e) {
          setMessage((e as Error).message);
        }
      }}
    >
      <div className="form-grid">
        <div className="field">
          <label>
            Report
            <select name="type">
              <option value="summary">Department summary</option>
              <option value="faculty">Faculty SLA</option>
              <option value="batch">Batch performance</option>
              <option value="honor">Honor roll</option>
            </select>
          </label>
        </div>
        <div className="field">
          <label>
            Frequency
            <select name="frequency">
              <option>DAILY</option>
              <option>WEEKLY</option>
              <option>MONTHLY</option>
            </select>
          </label>
        </div>
        <div className="field">
          <label>
            Format
            <select name="format">
              <option value="pdf">PDF</option>
              <option value="xlsx">Excel</option>
              <option value="csv">CSV</option>
            </select>
          </label>
        </div>
        <div className="field full">
          <label>
            Additional recipients (authorized HOD/Admin emails, comma-separated)
            <input name="recipients" />
          </label>
        </div>
      </div>
      <button className="btn secondary" style={{ marginTop: 15 }}>
        Schedule report
      </button>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
    </form>
  );
}
export function DeleteSchedule({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      className="btn ghost"
      onClick={async () => {
        await mutate("/api/v1/reports/schedules", "POST", {
          action: "DELETE",
          id,
        });
        router.refresh();
      }}
    >
      Remove schedule
    </button>
  );
}
