"use client";
import { useRouter } from "next/navigation";
export function MarkRead() {
  const router = useRouter();
  return (
    <button
      className="btn secondary"
      onClick={async () => {
        const r = await fetch("/api/v1/notifications", { method: "POST" });
        if (r.ok) router.refresh();
      }}
    >
      Mark all as read
    </button>
  );
}
