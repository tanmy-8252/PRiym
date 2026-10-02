"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="card">
      <h1>We couldn’t load this page.</h1>
      <p className="muted">
        Check that the database is running, then try again.
      </p>
      <button className="btn" style={{ marginTop: 20 }} onClick={reset}>
        Try again
      </button>
    </div>
  );
}
