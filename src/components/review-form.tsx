"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function ReviewForm({
  id,
  version,
  checklist,
  isHod,
  faculty,
  rejectionCodes = [],
}: {
  rejectionCodes?: string[];
  id: string;
  version: number;
  checklist: string[];
  isHod: boolean;
  faculty: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [checked, setChecked] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [reason, setReason] = useState("");
  const [reviewer, setReviewer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function decide(action: string) {
    if (
      ["APPROVE", "REJECT"].includes(action) &&
      !window.confirm(
        `${action === "APPROVE" ? "Approve and award points for" : "Reject"} this achievement? This decision will be recorded.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/v1/submissions/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          version,
          checklist: checked,
          comment,
          reasonCode: reason || undefined,
          reviewerId: reviewer || undefined,
        }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error.message);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <p className="tiny muted">
        Complete the checklist before approving or rejecting.
      </p>
      {checklist.map((item) => (
        <label className="check small" key={item}>
          <input
            type="checkbox"
            checked={checked.includes(item)}
            onChange={(e) =>
              setChecked((old) =>
                e.target.checked
                  ? [...old, item]
                  : old.filter((x) => x !== item),
              )
            }
          />
          {item}
        </label>
      ))}
      <div className="field" style={{ marginTop: 20 }}>
        <label htmlFor="review-comment">Feedback or clarification</label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Explain your decision or the information you need."
        />
      </div>
      <div className="field" style={{ marginTop: 18 }}>
        <label htmlFor="reason">Rejection reason</label>
        <select
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        >
          <option value="">Choose if rejecting</option>
          {rejectionCodes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
          <option value="INVALID_EVIDENCE">
            Evidence could not be verified
          </option>
          <option value="WRONG_CATEGORY">Incorrect category or level</option>
          <option value="DUPLICATE">Duplicate achievement</option>
          <option value="OTHER">Other — explain in feedback</option>
        </select>
      </div>
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      <div className="form-actions" style={{ justifyContent: "flex-start" }}>
        <button
          className="btn"
          disabled={busy}
          onClick={() => void decide("APPROVE")}
        >
          Approve
        </button>
        <button
          className="btn danger"
          disabled={busy}
          onClick={() => void decide("REJECT")}
        >
          Reject
        </button>
        <button
          className="btn secondary"
          disabled={busy}
          onClick={() => void decide("CLARIFY")}
        >
          Request clarification
        </button>
        {!isHod && (
          <button
            className="btn secondary"
            disabled={busy}
            onClick={() => void decide("ESCALATE")}
          >
            Escalate to HOD
          </button>
        )}
      </div>
      {isHod && (
        <div style={{ marginTop: 20 }}>
          <div className="field">
            <label htmlFor="reviewer">Reassign to faculty</label>
            <select
              id="reviewer"
              value={reviewer}
              onChange={(e) => setReviewer(e.target.value)}
            >
              <option value="">Select faculty</option>
              {faculty.map((f) => (
                <option value={f.id} key={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <div
            className="form-actions"
            style={{ justifyContent: "flex-start" }}
          >
            <button
              className="btn secondary"
              disabled={busy}
              onClick={() => void decide("REASSIGN")}
            >
              Reassign
            </button>
            <button
              className="btn secondary"
              disabled={busy}
              onClick={() => void decide("RETURN")}
            >
              Return to faculty
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
