"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, X } from "lucide-react";
import { LEVELS, institutionDate } from "@/lib/rules";
import { label } from "./ui";
import { uploadEvidenceFile } from "@/lib/evidence-upload";
type Evidence = { id: string; fileName: string };
export type FormInitial = {
  id: string;
  status: string;
  title: string;
  description: string;
  organization: string;
  categoryId: string;
  achievementDate: string;
  level: string;
  position: string | null;
  externalUrl: string | null;
  evidence: Evidence[];
  subcategory?: string | null;
  collaboratorIds?: string[];
};
export function AchievementForm({
  categories,
  initial,
  students = [],
}: {
  categories: {
    id: string;
    name: string;
    basePoints: number;
    subcategories?: string[];
  }[];
  students?: { id: string; name: string }[];
  initial?: FormInitial;
}) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState(
    initial?.categoryId || categories[0]?.id || "",
  );
  const [evidence, setEvidence] = useState<Evidence[]>(initial?.evidence ?? []);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFailures, setUploadFailures] = useState<
    { file: File; message: string }[]
  >([]);
  const [error, setError] = useState("");
  const [duplicate, setDuplicate] = useState(false);
  const [confirmDuplicate, setConfirmDuplicate] = useState(false);
  const [scannerUnavailable, setScannerUnavailable] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/v1/evidence/uploads", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((body) => {
        if (!controller.signal.aborted)
          setScannerUnavailable(body?.data?.ready === false);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  async function upload(files: File[]) {
    if (!files.length) return;
    setUploading(true);
    setError("");
    setUploadFailures([]);
    try {
      if (evidence.length + files.length > 5)
        throw new Error("Attach at most five files.");
      for (const file of files) {
        try {
          const item = await uploadEvidenceFile(file);
          // Preserve every successful attachment, even if the next file fails.
          setEvidence((old) => [...old, item]);
        } catch (e) {
          const message =
            e instanceof Error
              ? e.message
              : "The upload could not finish. Please try again.";
          setUploadFailures((old) => [...old, { file, message }]);
        }
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }
  async function save(form: HTMLFormElement, draft: boolean) {
    setBusy(true);
    setError("");
    const f = new FormData(form);
    const payload = Object.fromEntries(f.entries());
    try {
      if (uploadFailures.length)
        throw new Error(
          "Retry or remove the failed uploads before saving this achievement.",
        );
      if (!draft && !evidence.length)
        throw new Error(
          "Choose supporting evidence and wait for its Uploaded confirmation before submitting.",
        );
      const r = await fetch(
        initial ? `/api/v1/submissions/${initial.id}` : "/api/v1/submissions",
        {
          method: initial ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            collaboratorIds: f.getAll("collaboratorIds"),
            evidenceIds: evidence.map((e) => e.id),
            draft,
            confirmDuplicate,
          }),
        },
      );
      const body = await r.json();
      if (!r.ok) {
        if (body.error.code === "POTENTIAL_DUPLICATE") setDuplicate(true);
        throw new Error(body.error.message);
      }
      router.push(`/submissions/${body.data.id}`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      id="achievement-form"
      onSubmit={(e) => {
        e.preventDefault();
        void save(e.currentTarget, false);
      }}
    >
      <div className="form-grid">
        {!!categories.find((c) => c.id === categoryId)?.subcategories
          ?.length && (
          <div className="field">
            <label>
              Subcategory
              <select
                name="subcategory"
                defaultValue={initial?.subcategory || ""}
                required
              >
                <option value="">Choose subcategory</option>
                {categories
                  .find((c) => c.id === categoryId)
                  ?.subcategories?.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
              </select>
            </label>
          </div>
        )}
        <div className="field">
          <label>
            Collaborators (each submits their own claim)
            <select
              name="collaboratorIds"
              multiple
              defaultValue={initial?.collaboratorIds || []}
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="field full">
          <label htmlFor="title">Achievement title *</label>
          <input
            id="title"
            name="title"
            required
            minLength={5}
            maxLength={150}
            placeholder="e.g. Smart India Hackathon finalist"
            defaultValue={initial?.title}
          />
        </div>
        <div className="field">
          <label htmlFor="categoryId">Category *</label>
          <select
            id="categoryId"
            name="categoryId"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.basePoints} base points
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="level">Achievement level *</label>
          <select
            id="level"
            name="level"
            required
            defaultValue={initial?.level ?? ""}
          >
            <option value="" disabled>
              Select a level
            </option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {label(l)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="organization">Issuing organization *</label>
          <input
            id="organization"
            name="organization"
            required
            minLength={3}
            maxLength={200}
            defaultValue={initial?.organization}
            placeholder="Organization or event host"
          />
        </div>
        <div className="field">
          <label htmlFor="achievementDate">Achievement date *</label>
          <input
            id="achievementDate"
            name="achievementDate"
            type="date"
            required
            max={institutionDate()}
            defaultValue={initial?.achievementDate}
          />
          <span className="tiny muted">
            Within the current or preceding semester.
          </span>
        </div>
        <div className="field">
          <label htmlFor="position">Position / result</label>
          <input
            id="position"
            name="position"
            maxLength={100}
            defaultValue={initial?.position ?? ""}
            placeholder="Required for competitions, e.g. Winner"
          />
        </div>
        <div className="field">
          <label htmlFor="externalUrl">External link</label>
          <input
            id="externalUrl"
            name="externalUrl"
            type="url"
            defaultValue={initial?.externalUrl ?? ""}
            placeholder="https://…"
          />
        </div>
        <div className="field full">
          <label htmlFor="description">Tell us about the achievement *</label>
          <textarea
            id="description"
            name="description"
            required
            minLength={20}
            maxLength={1000}
            defaultValue={initial?.description}
            placeholder="Describe your contribution, outcome and why it matters."
          />
          <span className="tiny muted">
            20–1,000 characters. Be specific about your contribution.
          </span>
        </div>
        <div className="field full">
          <label htmlFor="evidence">Supporting evidence *</label>
          {scannerUnavailable && (
            <div className="notice error" role="status">
              Evidence uploads are temporarily unavailable. Please ask an
              administrator to check the document scanner settings.
            </div>
          )}
          <div className="upload">
            <Upload
              size={23}
              style={{ margin: "0 auto 12px", color: "#699274" }}
            />
            <p className="small">
              <strong>
                {uploading
                  ? "Uploading and checking evidence…"
                  : "Add certificates, letters or other proof"}
              </strong>
            </p>
            <p className="tiny muted" style={{ margin: "6px 0 15px" }}>
              PDF, JPG, PNG or MP4 · Up to 5 files · 10 MB each
            </p>
            <input
              aria-label="Upload supporting evidence"
              id="evidence"
              type="file"
              accept="application/pdf,image/jpeg,image/png,video/mp4"
              multiple
              disabled={busy || uploading}
              onChange={(e) => {
                const files = Array.from(e.currentTarget.files || []);
                // Clear the chooser so failed files can be selected again. The
                // attachment list below is the source of truth for saved evidence.
                e.currentTarget.value = "";
                void upload(files);
              }}
            />
          </div>
          {evidence.map((e) => (
            <div className="file-row" key={e.id}>
              <span className="small" style={{ display: "flex", gap: 8 }}>
                <FileText size={15} />
                {e.fileName} · Uploaded
              </span>
              <button
                type="button"
                className="btn ghost"
                aria-label={`Remove ${e.fileName}`}
                disabled={busy || uploading}
                onClick={() =>
                  setEvidence((old) => old.filter((x) => x.id !== e.id))
                }
              >
                <X size={15} />
              </button>
            </div>
          ))}
          {uploadFailures.map(({ file, message }, index) => (
            <div
              className="notice error"
              role="alert"
              key={`${file.name}-${index}`}
            >
              <strong>{file.name} — Upload failed</strong>
              <p>{message}</p>
              <button
                type="button"
                className="btn secondary"
                disabled={busy || uploading}
                onClick={() =>
                  void upload(uploadFailures.map((item) => item.file))
                }
              >
                Retry failed uploads
              </button>{" "}
              <button
                type="button"
                className="btn ghost"
                disabled={busy || uploading}
                aria-label={`Remove failed upload ${file.name}`}
                onClick={() =>
                  setUploadFailures((old) => old.filter((_, i) => i !== index))
                }
              >
                Remove
              </button>
            </div>
          ))}
          <p
            className="tiny muted"
            aria-live="polite"
            style={{ marginTop: 10 }}
          >
            {uploading
              ? "Please wait while your files upload and finish their security checks."
              : evidence.length
                ? `${evidence.length} of 5 files uploaded and ready to attach.`
                : "Choose a file and wait for its Uploaded confirmation before submitting."}
          </p>
        </div>
      </div>
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      {duplicate && (
        <label className="check small">
          <input
            type="checkbox"
            checked={confirmDuplicate}
            onChange={(e) => setConfirmDuplicate(e.target.checked)}
          />{" "}
          I confirm this is a separate achievement from the similar submission.
        </label>
      )}
      <div className="form-actions">
        <span className="tiny muted" style={{ marginRight: "auto" }}>
          Submitted achievements are reviewed by your faculty mentor.
        </span>
        {(!initial || initial.status === "DRAFT") && (
          <button
            type="button"
            className="btn secondary"
            disabled={busy || uploading || uploadFailures.length > 0}
            onClick={() => {
              const f = document.getElementById(
                "achievement-form",
              ) as HTMLFormElement;
              if (f.reportValidity()) void save(f, true);
            }}
          >
            Save draft
          </button>
        )}
        <button
          className="btn"
          disabled={
            busy ||
            uploading ||
            uploadFailures.length > 0 ||
            evidence.length === 0
          }
        >
          {busy
            ? "Saving…"
            : initial && initial.status !== "DRAFT"
              ? "Resubmit achievement →"
              : "Submit for review →"}
        </button>
      </div>
    </form>
  );
}
