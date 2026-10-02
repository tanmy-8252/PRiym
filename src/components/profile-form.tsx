"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { mutate } from "./admin-forms";
export function ProfileForm({
  bio,
  portfolioPublic,
  leaderboardVisible,
  details,
}: {
  details: {
    phone: string;
    linkedIn: string;
    github: string;
    officeHours: string;
    expertise: string;
    emailPreferences: string[];
  };
  bio: string;
  portfolioPublic: boolean;
  leaderboardVisible: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        try {
          await mutate("/api/v1/profile", "PATCH", {
            bio: f.get("bio"),
            phone: f.get("phone"),
            linkedIn: f.get("linkedIn"),
            github: f.get("github"),
            officeHours: f.get("officeHours"),
            expertise: f.get("expertise"),
            emailPreferences: f.getAll("emailPreferences"),
            portfolioPublic: f.get("portfolioPublic") === "on",
            leaderboardVisible: f.get("leaderboardVisible") === "on",
          });
          setMessage("Profile updated.");
          router.refresh();
        } catch (e) {
          setMessage((e as Error).message);
        }
      }}
    >
      <div className="field">
        <label htmlFor="bio">A few words about you</label>
        <textarea id="bio" name="bio" defaultValue={bio} maxLength={500} />
      </div>
      <div className="form-grid">
        {(
          ["phone", "linkedIn", "github", "officeHours", "expertise"] as const
        ).map((key) => (
          <div className="field" key={key}>
            <label htmlFor={key}>
              {key === "linkedIn"
                ? "LinkedIn URL"
                : key === "github"
                  ? "GitHub URL"
                  : key === "officeHours"
                    ? "Office hours"
                    : key === "expertise"
                      ? "Areas of expertise"
                      : "Phone"}
            </label>
            <input
              id={key}
              name={key}
              type={["linkedIn", "github"].includes(key) ? "url" : "text"}
              defaultValue={details[key]}
            />
          </div>
        ))}
      </div>
      <details style={{ margin: "15px 0" }}>
        <summary>Email notification preferences</summary>
        <p className="tiny muted">
          Check events to mute email. In-app and account-security messages stay
          enabled.
        </p>
        {[
          "ALL",
          "Achievement received",
          "New achievement to review",
          "Resubmission received",
          "Achievement approved",
          "Achievement rejected",
          "Achievement clarification requested",
          "Badge earned",
          "Report ready",
          "Review reminder",
          "Review SLA breached",
          "Department review SLA breached",
          "Honor roll achieved",
        ].map((event) => (
          <label className="check small" key={event}>
            <input
              type="checkbox"
              name="emailPreferences"
              value={event}
              defaultChecked={details.emailPreferences.includes(event)}
            />
            {event === "ALL" ? "Mute all non-security email" : event}
          </label>
        ))}
      </details>
      <label className="check small">
        <input
          name="portfolioPublic"
          type="checkbox"
          defaultChecked={portfolioPublic}
        />{" "}
        Make my verified portfolio public
      </label>
      <label className="check small">
        <input
          name="leaderboardVisible"
          type="checkbox"
          defaultChecked={leaderboardVisible}
        />{" "}
        Show my name on the department leaderboard
      </label>
      {message && (
        <div className="notice" role="status">
          {message}
        </div>
      )}
      <button className="btn">Save profile</button>
    </form>
  );
}
export function SecurityForm() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setBusy(true);
        try {
          await mutate("/api/v1/security", "POST", {
            action: f.get("newPassword") ? "PASSWORD" : "REVOKE_ALL",
            currentPassword: f.get("currentPassword"),
            newPassword: f.get("newPassword") || undefined,
          });
          await signOut({ callbackUrl: "/login" });
        } catch (e) {
          setMessage((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="field">
        <label htmlFor="currentPassword">Current password</label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>
      <div className="field" style={{ marginTop: 20 }}>
        <label htmlFor="newPassword">
          New password{" "}
          <span className="muted">(leave empty to revoke all sessions)</span>
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
        />
      </div>
      <p className="tiny muted" style={{ margin: "12px 0 20px" }}>
        8–72 characters, uppercase, lowercase, number and special character.
        Saving signs you out of all sessions.
      </p>
      {message && (
        <div className="notice error" role="alert">
          {message}
        </div>
      )}
      <button className="btn secondary" disabled={busy}>
        Update account security
      </button>
    </form>
  );
}
